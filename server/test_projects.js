const axios = require('axios');

async function test() {
  try {
    const login = await axios.post('http://127.0.0.1:8080/api/v1/auth/login', {
      email: 'admin@upnixo.com',
      password: 'Password123!'
    });
    const token = login.data.data.access_token;
    
    const projects = await axios.get('http://127.0.0.1:8080/api/v1/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(JSON.stringify(projects.data.data.slice(0, 2), null, 2));
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();
