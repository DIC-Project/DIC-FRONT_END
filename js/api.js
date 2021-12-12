const base_url = 'https://random-api1.herokuapp.com/dic_2021/api';


async function callApi(method = 'get', path, data) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${base_url}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'Authorization': token
    },
    ...(method != 'get' && ({
      body: JSON.stringify(data)
    }))
  });
  if (response.status > 500) return alert('Internal Server Error');
  if (response.status == 401) {
    window.location.href = 'index.html';
    return;
  };

  const json = await response.json();
  if (response.ok) return json;

  json.status = response.status;
  return Promise.reject(json);

};

const request = {
  get: (...args) => callApi('get', ...args),
  post: (...args) => callApi('post', ...args),
  patch: (...args) => callApi('patch', ...args),
  put: (...args) => callApi('put', ...args)
};

function getQuery(name) {
  const params = (new URL(document.location)).searchParams;
  return params.get(name);
};

async function staffLogin(e) {
  e.preventDefault();
  const username = e.target.elements.username.value;
  const password = e.target.elements.password.value;
  request.post('/users/staff/signin', {
      username,
      password
    })
    .then((data) => {
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user_type', 'staff');
      window.location.href = 'Staff_Dashboard.html';
    })
    .catch((err) => {
      if (err.status === 400) {
        alert(err.errors[0].message.en);
      };
    });
}

function adminLogin(e) {
  e.preventDefault();
  const username = e.target.elements.username.value;
  const password = e.target.elements.password.value;
  request.post('/users/admin/signin', {
      username,
      password
    })
    .then((data) => {
      localStorage.setItem('user_type', 'admin');
      localStorage.setItem('token', data.accessToken);
      window.location.href = 'Admin_Dashboard.html';
    })
    .catch((err) => {
      if (err.status === 400) {
        alert(err.errors[0].message.en);
      }
    });
};

const appendTeams = (teams) => {
  const table = document.getElementById('Team_table');
  for (const team of teams) {
    const row = table.insertRow();
    row.insertCell(0).innerHTML = team.team_id;
    row.insertCell(1).innerHTML = team.name;
    row.insertCell(2).innerHTML = team.location;
    row.insertCell(3).innerHTML = team.contact;
    row.insertCell(4).innerHTML = '<select><input type="Month" name="" value="2021-11"></select>';
    row.insertCell(5).innerHTML = `<a href="addToWeaving.html?team_id=${team.id}">SELECT</a>`;
  }
};

function getTeams() {
  request.get('/users/get_teams')
    .then((data) => {
      appendTeams(data.teams);
    });
}


const onClick = (id) => {
  const c44 = document.getElementById("44");
  const c58 = document.getElementById("58");
  if (id == "44") {
    c44.checked = true;
    c58.checked = false;
  } else {
    c58.checked = true;
    c44.checked = false;
  };
  document.documentElement.style.setProperty('--show44', c44.checked ? 'table-row' : 'none');
  document.documentElement.style.setProperty('--show58', c58.checked ? 'table-row' : 'none');

};

async function loadWorkPage(workName) {
  const header = "<tr><th>ID</th><th>Name</th></tr>";
  const table = document.getElementById("dataTable");
  const category = getQuery('category');
  let membersHtml = header;
  let current = category || "44";
  onClick(current);

  const id = getQuery('team_id');
  request.get(`/users/get_one_team/${id}`)
    .then(({ team: data }) => {
      document.getElementById('title').innerHTML = data.name;
      document.getElementById('team_id').innerHTML = data.team_id;
      document.getElementById('location').innerHTML = data.location;
      document.getElementById('contact').innerHTML = data.contact;
    });
  const [members, works] = await Promise.all([
    request.get(`/users/get_team_members/${id}`).then(q => q.teamMembers),
    request.get(`/users/get_works`).then(q => q.works)
  ]);
  const work = works.find((item) => item.name == workName);
  if (!work) return alert(`Please create work ${workName} on backend before proceeding`);
  window.work = work;
  for (const id of work.workers_44) {
    const member = members.find((item) => item.id == id);
    if (member) {
      membersHtml += `<tr class="category44"><td>${member.id}</td><td>${member.name}</td></tr>`;
    };

  }
  for (const id of work.workers_58) {
    const member = members.find((item) => item.id == id);
    if (member) {
      membersHtml += `<tr class="category58"><td>${member.id}</td><td>${member.name}</td></tr>`;
    };
  };
  table.innerHTML = membersHtml;
  onClick(current);
};

function addTeam(e) {
  e.preventDefault();
  const body = {};
  for (let i = 0; i < e.target.elements.length; i++) {
    body[e.target.elements[i].getAttribute("name")] = e.target.elements[i].value;
  };
  request.post('/users/add_new_team', body)
    .then((data) => {
      appendTeams([data]);
      Hide();
      alert('Team added successfully')
    });
};

function onTeamMemberClick(id, value) {
  if (value == true && !window.ids.includes(id)) {
    window.ids.push(id);
  } else {
    window.ids = window.ids.filter((item) => item != id);
  };
}

function onTeamSubmit() {
  const workId = getQuery('work_id');
  const category = getQuery('category')
  request.put(`/users/update_work/${workId}`, {
    [`workers_${category}`]: window.ids
    })
    .then((data) => {
      alert('Team members updated');
      goToWorkPage(getQuery('page'), category);
    });
};

function loadTeamMembers() {
  let html = "<tr><th></th><th>ID</th><th>Name</th><th>Ac. No.</th><th>Bank Name</th><th>IFSC code</th><th>Branch Name</th><th>Action</th></tr>";
  const mIds = JSON.parse(getQuery('ids'));
  window.ids = mIds;
  request.get(`/users/get_team_members/${getQuery('team_id')}`)
    .then(({ teamMembers: data }) => {
      for (const team of data) {
        const is = window.ids.includes(team.id);
        html += `<tr><td><input id="${team.id}"  onclick="onTeamMemberClick(this.id, this.checked)" type="checkbox" ${is ? 'checked': 'null'}></td><td>${team.id}</td><td>${team.name}</td></tr>`;
      };
      document.getElementById('dataTab').innerHTML = html;
    });
}

function goToWorkPage(page, category = "44") {
  window.location.href = `${page}?team_id=${getQuery('team_id')}&category=${category}`;
};

function goToTeamList() {
  const category = document.getElementById('44').checked ? '44' : '58';
  window.location.href = `teamlist.html?page=${window.location.pathname}&team_id=${getQuery('team_id')}&category=${category}&work_id=${work.id}&ids=${JSON.stringify(work[`workers_${category}`])}`;
}