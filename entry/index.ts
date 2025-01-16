

declare var APPVERSION: any;

type StateT = {
	state: 'loggedout' | 'loggingin' | 'loggedin'
	loginerror: string
}


let s:StateT = { state: 'loggedout', loginerror: '' }




window.addEventListener("load", async (_e) => {

	const id_token = localStorage.getItem('id_token');

	if (id_token) {
		s.state = 'loggedin'
		sc()	
		return
	} 
	
	else if (window.location.search.includes("loggingin")) {
		s.state = 'loggingin'
		sc()
		return
	}

	else {
		s.state = 'loggedout'
		sc()
		return
	}
});




/*
function setup_service_worker() {

	const update_to_href = "https://yavada.com/bouncebacktonifty.html"
	const origin = window.location.origin
	const urlParams = new URLSearchParams(window.location.search);

	navigator.serviceWorker.register('sw.js').then(reg => {

		if (urlParams.get("update") && urlParams.get("update") === "1") {

			s.state = 'updating'
			sc()

			setTimeout(() => {
				reg.update()
					.then(_issuccess=> {
						console.log("update then called")
					})
					.catch(err=> {
						window.location.href = '/index.html?update_failed=1&err=' + err
					})
			}, 2000)
		}

		else if (urlParams.get("update") && urlParams.get("update") === "done") {
			s.state = 'updated'
			sc()

			setTimeout(() => {
				window.location.href = "/index.html"
			}, 3000)
		}
	})


	navigator.serviceWorker.addEventListener('message', (_event) => {
	})

	navigator.serviceWorker.addEventListener('controllerchange', onNewServiceWorkerControllerChange);


	function onNewServiceWorkerControllerChange() {
		console.log('[Main Thread] New service worker has taken control. Reloading...');
		navigator.serviceWorker.removeEventListener('controllerchange', onNewServiceWorkerControllerChange);

		localStorage.clear();

		s.state = 'updated'
		sc()

		setTimeout(() => {
			window.location.href = "/index.html"
		}, 3000)
	}
}
*/


async function loginsubmit() {

	const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=` + (window as any).identity_platform_key

	const email = (document.getElementById("email") as HTMLInputElement).value;
	const password = (document.getElementById("password") as HTMLInputElement).value;

	const body = { email, password, returnSecureToken: true };

	const opts = {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json'
		}
	}

	const r = await fetch(url, opts);
	const data = await r.json();

	if (data.error) {
		s.loginerror = data.error.message

	} else {
		localStorage.setItem('id_token', data.idToken);
		localStorage.setItem('token_expires_at',  ( (Math.floor(Date.now()/1000)) + Number(data.expiresIn) ).toString() ),
		localStorage.setItem('refresh_token', data.refreshToken);
		localStorage.setItem('user_email', data.email);

		if (data.email === "accounts@risingtiger.com")
			localStorage.setItem('auth_group', 'admin');
		else 
			localStorage.setItem('auth_group', 'user');

		window.location.href = '/v#home'
	}
}




function sc() {

	// hopefully soon I can circle back to this and get entry working on lit. AND, better yet, get all auth stuff back into home and/or turn auth view into component that is in home and create dashboard that is logged in stuff

	Lit_Render(template(s), document.getElementById("litroot"));
}




const template = (_s: StateT) => { return Lit_Html`

	<div id="login" class="${_s.state === 'loggingin' ? 'active' : ''}">
		<h1>Xen Login</h1>

		<ul class="items">
			<li>
				<h5>Email</h5>
				<input type="text" name="username" id="email" value="">
			</li>

			<li>
				<h5>Password</h5>
				<input type="password" name="password" id="password" value="">
			</li>
		</ul>

		<div @click="${()=>loginsubmit()}" class="btn" id="submit_login_button">login</div>


		<div id="login_errormsg" class="${_s.loginerror !== '' ? 'active' : ''}"></div>


	</div>

	<div id="logged_out" class="${_s.state === 'loggedout' ? 'active' : ''}">
		<div id="login_button" class="btn"><a href='/index.html?loggingin=true'>Xen Login</a></div>
		<button @click="${()=>window.location.href='/index.html?update=1'}">Update SW</button>
	</div>

	<div id="logged_in" class="${_s.state === 'loggedin' ? 'active' : ''}">
		<div id="home_button" class="btn"><a href="/v#home">Xen Dashboard Home</a></div>
		<!--<div id="logout_button" class="btn"><a>Log out</a></div>-->
	</div>
`; };


