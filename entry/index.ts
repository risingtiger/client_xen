


declare var Lit_Html: any;
declare var Lit_Render: any;


type StateT = {
	propa: string;
}


let els:any = {}
let s:StateT = { propa: "hello" }


window.addEventListener("load", async (_e) => {

	if (window.location.protocol === "https:") {
		setup_service_worker()
	}

	document.getElementById("login_button")!.addEventListener("click", () => { show_login() });

	const id_token = localStorage.getItem('id_token');
	
	els = {
		logged_in: document.getElementById("logged_in") as HTMLElement,
		logged_out: document.getElementById("logged_out") as HTMLElement,
		update: document.getElementById("update") as HTMLElement,
		update_progress: document.getElementById("update_progress") as HTMLElement,
		update_done: document.getElementById("update_done") as HTMLElement,
		login: document.getElementById("login") as HTMLElement,
		login_button: document.getElementById("login_button") as HTMLElement,
		logout_btn: document.getElementById("logout_button") as HTMLElement,
		submit_login_button: document.getElementById("submit_login_button") as HTMLElement,
		home_btn: document.getElementById("home_button") as HTMLElement,
		login_errormsg: document.getElementById("login_errormsg") as HTMLElement,
	}

	if (id_token) {
		els.logged_out.classList.remove("active");
		els.logged_in.classList.add("active");
	} else {
		els.logged_out.classList.add("active");
		els.logged_in.classList.remove("active");
	}

	els.login_button.addEventListener("click", () => { show_login() });

    if (window.location.search.includes("errmsg")) {

        let errmsg = window.location.search.split("errmsg=")[1];

        errmsg = decodeURIComponent(errmsg);

        if (errmsg === "not_authorized" || errmsg === "not_signed_in") {
            show_login();
        } else if (errmsg === "lazyload_server_error" || errmsg === "lazyload_overlay") {
			alert ("Could Not Lazy Load Item")

        } else if (errmsg === "fetch_lassy_timeout") {
            alert("Fetch Lassy Timeout.");

        } else if (errmsg === "sse_listner_already_exists") {
            alert("Server Side Connection Already Exists.");

        } else if (
			errmsg === "fetchlassie_not_authorized" || 
			errmsg === "fetchlassie_server_error" || 
			errmsg === "fetchlassie_network_error" || 
			errmsg === "fetchlassie_id_token_missing" || 
			errmsg === "fetchlassie_refresh_auth_failed" || 
			errmsg === "fetchlassie_network_refresh_auth_failed" || 
			errmsg === "fetchlassie_timeout" 
		) {
            alert("Fetchlassie Error.");

        } else if (
			errmsg === "firestorelive_indexeddb_put" || 
			errmsg === "firestorelive_indexeddb_put" || 
			errmsg === "firestorelive_indexeddb_get" || 
			errmsg === "firestorelive_indexeddb_get" || 
			errmsg === "firestorelive_listener" 
		) {
            alert("Firestore Live Error.");

        } else if (errmsg === "engagementlisten_already_exists") {
            alert("Engagement Listen Error.");

        } else {
            alert("No Error Type Supplied.");
        }
    }

	else if (window.location.search.includes("update_done")) {
		document.getElementById("update")!.classList.add("active");
		document.getElementById("update_progress")!.classList.remove("active");
		document.getElementById("update_done")!.classList.add("active");
	}
});




function setup_service_worker() {

	let updated = false;
	let activated = false;
	navigator.serviceWorker.register('sw.js').then(regitration => {

		if (window.location.search.includes("update_init")) {

			document.getElementById("update")!.classList.add("active");
			document.getElementById("update_progress")!.classList.add("active");
			document.getElementById("update_done")!.classList.remove("active");

			regitration.update();
		}

		regitration.addEventListener("updatefound", () => {

			const worker = regitration.installing;
			worker!.addEventListener('statechange', () => {

				if (worker!.state === "activated") {
					activated = true;
					checkUpdate();
				}
			});
		});
	});
	navigator.serviceWorker.addEventListener('controllerchange', () => {

		updated = true;
		checkUpdate();
	});

	navigator.serviceWorker.addEventListener('message', (_event) => {
	})

	function checkUpdate() {
		if (activated && updated) {
			window.location.href = "/index.html?update_done=1"
		}
	}
}




function show_login() {
	els.login.classList.add("active");
	els.login_button.style.display = "none";


	els.submit_login_button.addEventListener("click", async () => {

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
			document.getElementById("login_errormsg")!.classList.add("active");
			document.getElementById("login_errormsg")!.innerText = data.error.message

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
	});
}




function sc() {

	// hopefully soon I can circle back to this and get entry working on lit. AND, better yet, get all auth stuff back into home and/or turn auth view into component that is in home and create dashboard that is logged in stuff

	Lit_Render(
		this.template(this.s, this.filtered_sorted_machines),
		this.document.getElementById("litroot"),
	);
}
const template = (_s: StateT) => { return Lit_Html``; };


