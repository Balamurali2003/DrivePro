const fs = require('fs');
const path = require('path');

const API_TOKEN = 'Q84vIZ0WXucJyBkHqK4bJz4B8ENQ4XLWJQBiiqrN0c136c55';
const USERNAME = 'u766698539';
const DOMAIN = 'nellaimuniskanna.com';
const BASE_URL = 'https://developers.hostinger.com';

async function main() {
  console.log(`🚀 Starting automated deployment for ${DOMAIN} on Hostinger...`);

  // Step 1: Request upload URL
  console.log('📡 Requesting upload URL from Hostinger API...');
  const uploadUrlRes = await fetch(`${BASE_URL}/api/hosting/v1/files/upload-urls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: USERNAME,
      domain: DOMAIN
    })
  });

  const uploadUrlData = await uploadUrlRes.json();
  if (!uploadUrlRes.ok) {
    console.error('❌ Failed to get upload URL:', uploadUrlData);
    process.exit(1);
  }

  console.log('✅ Upload URL received:', uploadUrlData);
  const { url, auth_key, rest_auth_key } = uploadUrlData;

  // Step 2: Upload nellaimuniskanna.com.zip using TUS protocol
  const zipPath = path.join(__dirname, '..', 'nellaimuniskanna.com.zip');
  const zipStat = fs.statSync(zipPath);
  const fileSize = zipStat.size;
  console.log(`📦 Uploading ${zipPath} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)...`);

  const targetUploadUrl = `${url}/nellaimuniskanna.com.zip?override=true`;

  // Step 2a: Initiate TUS upload with POST
  console.log('  -> Sending POST to initialize TUS upload...');
  const initRes = await fetch(targetUploadUrl, {
    method: 'POST',
    headers: {
      'X-Auth': auth_key,
      'X-Auth-Rest': rest_auth_key,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(fileSize),
      'Upload-Offset': '0'
    }
  });

  console.log(`  -> Init response status: ${initRes.status} ${initRes.statusText}`);
  if (initRes.status !== 201 && initRes.status !== 200 && initRes.status !== 204) {
    const initText = await initRes.text();
    console.error('❌ TUS Init failed:', initText);
    process.exit(1);
  }

  // Step 2b: Send file data with PATCH
  console.log('  -> Sending PATCH with binary payload...');
  const fileBuffer = fs.readFileSync(zipPath);
  const patchRes = await fetch(targetUploadUrl, {
    method: 'PATCH',
    headers: {
      'X-Auth': auth_key,
      'X-Auth-Rest': rest_auth_key,
      'Tus-Resumable': '1.0.0',
      'Content-Type': 'application/offset+octet-stream',
      'Upload-Offset': '0'
    },
    body: fileBuffer
  });

  console.log(`  -> Patch response status: ${patchRes.status} ${patchRes.statusText}`);
  if (patchRes.status !== 204 && patchRes.status !== 200 && patchRes.status !== 201) {
    const patchText = await patchRes.text();
    console.error('❌ TUS Patch upload failed:', patchText);
    process.exit(1);
  }

  console.log('🎉 Upload completed successfully!');

  // Step 3: Trigger Node.js build process via Hostinger API
  console.log('⚙️ Triggering Node.js build on Hostinger...');
  const buildPayload = {
    node_version: 20,
    app_type: 'express',
    entry_file: 'server.js',
    build_script: 'build',
    package_manager: 'npm',
    source_type: 'archive',
    source_options: {
      archive_path: 'nellaimuniskanna.com.zip'
    }
  };

  const buildRes = await fetch(`${BASE_URL}/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildPayload)
  });

  const buildData = await buildRes.json();
  if (!buildRes.ok) {
    console.error('❌ Failed to trigger build:', buildData);
    process.exit(1);
  }

  console.log('🚀 Build started:', buildData);
  const buildUuid = buildData.uuid;

  // Step 4: Poll build status until complete
  console.log(`⏳ Monitoring build ${buildUuid}...`);
  let state = buildData.state || 'running';
  while (state !== 'completed' && state !== 'ready' && state !== 'failed') {
    await new Promise(r => setTimeout(r, 4000));
    const statusRes = await fetch(`${BASE_URL}/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds/${buildUuid}`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    const statusData = await statusRes.json();
    state = statusData.state;
    console.log(`   -> Build state: ${state}`);
    if (state === 'failed') {
      const logsRes = await fetch(`${BASE_URL}/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds/${buildUuid}/logs`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });
      const logsData = await logsRes.json();
      console.error('❌ Build failed with logs:', logsData);
      process.exit(1);
    }
  }

  console.log('🎉 BUILD SUCCESSFUL! Server deployed on Hostinger!');

  // Step 5: Restart the Node.js server to ensure fresh state
  console.log('🔄 Restarting Node.js service...');
  const restartRes = await fetch(`${BASE_URL}/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/server/restart`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  console.log(`Restart response status: ${restartRes.status}`);

  console.log(`\n========================================================`);
  console.log(`🌟 SUCCESS! https://${DOMAIN} is now LIVE ON HOSTINGER!`);
  console.log(`========================================================\n`);
}

main().catch(err => {
  console.error('Unhandled deployment error:', err);
  process.exit(1);
});
