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
    /**modify*/
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

async function loadMetrePage(id) {
  window.members = [];
  window.w = {};
  window.updates = {};
  const [works, data] = await Promise.all([
    request.get(`/users/get_works`)
    .then(q => q.works),
  request.get(`/users/get_team_members/${id}`)
    .then(q => q.teamMembers)
  ]);
  for (const work of works) {
    window.w[work.name] = work;
  };
  const table = document.getElementById('dataTable');
  window.members = data;
  for (const member of data) {
    const tr = document.createElement('tr');
    tr.setAttribute('id', 'm' + member.id);
    tr.innerHTML = `<td>${member.id}</td><td>${member.name}</td><td><input type="number" value="${member.input || 0}" onchange="onMetreChange('${member.id}', this.value, '${member.name}')"></td><td data-id="weaving">${member.weaving || '0'}</td><td data-id="winding">${member.winding || 0}</td><td data-id="warping">${member.warping || 0}</td><td data-id="joining">${member.joining || 0}</td><td data-id="pf">${member.pf || 0}</td><td data-id="esi">${member.esi || 0}</td><td data-id="gt">${member.graduity || 0}</td><td data-id="others">${member.others || 0}</td><td data-id="sum">${member.sum || 0}</td><td data-id="margin">${member.margin || 0}</td><td data-id="mw">${member.mw || 0}</td><td data-id="mt">${member.mt || 0}</td><td data-id="dividends">${member.dividends || 0}</td>`;
    table.appendChild(tr);
  };

}

function setText(id, dataId, value) {
  const el = document.querySelector(`#m${id} > td[data-id="${dataId}"`);
  el.textContent = Math.trunc(value * 100) / 100;
}

function onMetreChange(id, value, name) {
  value = Number(value);
  if (!value) return alert('Invalid number provided');
  const values = calculate(id, value, name);
  console.log(values);
  setText(id, 'weaving', values.weaving);
  setText(id, 'winding', values.winding);
  setText(id, 'warping', values.warping);
  setText(id, 'joining', values.joining);
  setText(id, 'pf', values.pf);
  setText(id, 'esi', values.esi);
  setText(id, 'gt', values.gratuity);
  setText(id, 'others', values.others);
  setText(id, 'margin', values.margin);
  setText(id, 'sum', values.sum);
  setText(id, 'mw', values.mw);
  setText(id, 'mt', values.mt);
  setText(id, 'dividends', values.dividends);
  window.updates[id] = values;
};

const formulas44 = {
  weaving: 56.98,
  winding: 17.81,
  warping: 2.31,
  joining: 2.03,
  pf: 12,
  esi: 3.25,
  gratuity: 7,
  others: 20.33
};

const formulas58 = {
  weaving: 68.53,
  winding: 20.66,
  warping: 2.03,
  joining: 2.59,
  pf: 12,
  esi: 3.25,
  gratuity: 7,
  others: 20.33
};

function calculate(id, value, name) {
  let [totalMargin, totalSum] = Object.values(updates).filter(e => e.id !== id).reduce((prev, cur) => {
    prev[0] = prev[0] + cur.input;
    prev[1] = prev[1] + cur.sum;
    return pre;
  }, [value, 0]);
  totalMargin = totalMargin * 3.96;
  function isValid(name, is) {
    const work = w[name];
    if (!work) return false;
    if (is && work.workers_44.includes(id)) return true;
    if (work.workers_58.includes(id)) return true;
    return false;
  };

  let values = {
    id,
    name,
    input: value,
    winding: 0,
    weaving: 0,
    warping: 0,
    joining: 0,
    pf: 0,
    esi: 0,
    gratuity: 0,
    others: 0,
    margin: totalMargin,
    sum: 0,
    mw: 0,
    mt: 0,
    dividends: 0
  };

  Object.keys(w).map((name) => {
    // 44 category
    if (isValid(name, true)) {
      values[name] += value * formulas44[name];
      values.pf += formulas44.pf / 100 * values[name];
      values.esi += formulas44.esi / 100 * values[name];
      values.gratuity += formulas44.gratuity / 100 * values[name];
      values.others += formulas44.others / 100 * values[name];
      values.sum += (values[name] + values.pf + values.esi + values.gratuity + values.others);
    }

    // 58 category
    if (isValid(name)) {
      values[name] += value * formulas58[name];
      values.pf += formulas58.pf / 100 * values[name];
      values.esi += formulas58.esi / 100 * values[name];
      values.gratuity += formulas58.gratuity / 100 * values[name];
      values.others += formulas58.others / 100 * values[name];
      values.sum += (values[name] + values.pf + values.esi + values.gratuity + values.others);
    };

    if (name == 'weaving') {
      values.mw += value * 34;
    };
  });
  
  totalSum += values.sum;
  values.mt = totalSum - values.mw;
  values.dividends = totalMargin + values.mt;
  return values;
};

function onMetreSubmit() {
  exportToCsv()
  request.put(`/users/update_team_member_bulk`, Object.values(window.updates))
  .then((data) => {
    console.log(data);
    alert('Member updated');
  })
};