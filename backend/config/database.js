import mongoose from 'mongoose';
import dns from 'dns';

const DB_NAME = process.env.MONGODB_DB_NAME || 'makeit';

async function resolveSrvWithPublicDns(hostname) {
  const { Resolver } = await import('dns');
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  return new Promise((resolve, reject) => {
    resolver.resolveSrv(hostname, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses);
    });
  });
}

async function buildDirectUriFromSrv(srvUri) {
  if (!srvUri?.startsWith('mongodb+srv://')) return null;

  try {
    const withoutProtocol = srvUri.replace('mongodb+srv://', '');
    const [credentialsAndHost, query = ''] = withoutProtocol.split('?');
    const atIndex = credentialsAndHost.lastIndexOf('@');
    const credentials = credentialsAndHost.slice(0, atIndex);
    const hostAndDb = credentialsAndHost.slice(atIndex + 1);
    const [clusterHost, dbFromUri = ''] = hostAndDb.split('/');
    const dbName = dbFromUri.split('?')[0] || DB_NAME;

    const records = await resolveSrvWithPublicDns(`_mongodb._tcp.${clusterHost}`);
    const hosts = records.map((r) => `${r.name}:${r.port}`).join(',');
    const params = new URLSearchParams(query);
    params.set('ssl', 'true');
    params.set('authSource', 'admin');
    if (!params.has('retryWrites')) params.set('retryWrites', 'true');
    if (!params.has('w')) params.set('w', 'majority');

    return `mongodb://${credentials}@${hosts}/${dbName}?${params.toString()}`;
  } catch (err) {
    console.warn(`Could not build direct URI from SRV: ${err.message}`);
    return null;
  }
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const srvUri = process.env.MONGODB_URI;
  const directUri = process.env.MONGODB_URI_DIRECT;

  const uris = [srvUri, directUri].filter(Boolean);

  if (uris.length === 0) {
    throw new Error(
      'MONGODB_URI is required. All auth, projects, tasks, and activity data is stored in MongoDB Atlas.'
    );
  }

  dns.setDefaultResultOrder('ipv4first');

  let lastError;

  // 1. Try connecting to configured URIs first (srvUri, directUri)
  for (const uri of uris) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await mongoose.connect(uri, {
          dbName: DB_NAME,
          serverSelectionTimeoutMS: 5000, // Reduced from 20000 for faster retry / fallback
          socketTimeoutMS: 45000,
          family: 4,
        });
        console.log(`Connected to MongoDB Atlas — database: "${DB_NAME}"`);
        console.log('Collections: users | projects | tasks | activities');
        return;
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          console.warn(`Retry ${attempt}/3: ${err.message}`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  // 2. If configured URIs fail, try building and connecting via resolved DNS as last-resort fallback
  if (srvUri && srvUri.startsWith('mongodb+srv://')) {
    console.log('Connection failed. Resolving SRV record using public DNS for fallback direct connection...');
    const builtDirectUri = await buildDirectUriFromSrv(srvUri);
    if (builtDirectUri) {
      try {
        await mongoose.connect(builtDirectUri, {
          dbName: DB_NAME,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          family: 4,
        });
        console.log(`Connected to MongoDB Atlas (DNS resolved direct fallback) — database: "${DB_NAME}"`);
        return;
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw new Error(
    `Could not connect to MongoDB Atlas database "${DB_NAME}". ` +
      'Steps: 1) MongoDB Atlas → Network Access → Add IP Address (0.0.0.0/0). ' +
      '2) Verify username/password. 3) Set MONGODB_URI_DIRECT in .env. ' +
      `Error: ${lastError?.message}`
  );
}
