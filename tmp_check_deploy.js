const https = require('https');
const token = process.env.NETLIFY_AUTH_TOKEN;
const siteId = '9de81dad-a341-4a3e-8695-19757bbb54ae';

const options = {
  hostname: 'api.netlify.com',
  path: `/api/v1/sites/${siteId}/deploys?per_page=3`,
  headers: { 'Authorization': `Bearer ${token}` }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const deploys = JSON.parse(data);
    deploys.forEach(d => {
      console.log(`ID: ${d.id} | State: ${d.state} | Error: ${d.error_message || 'none'} | URL: ${d.ssl_url}`);
    });
  });
}).on('error', console.error);
