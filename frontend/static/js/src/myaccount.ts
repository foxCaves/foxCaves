function getAccountForm() {
    return document.getElementById('account_form') as HTMLFormElement;
}

async function submitForm(data: { [key: string]: string }) {
    const form = getAccountForm();
    data.current_password = form.current_password.value;
    const res = await fetch('/api/v1/users/@me', {
        method: 'PATCH',
        body: new URLSearchParams(data),
    });
    if (res.status === 200) {
        return { ok: true };
    }
    const resp = await res.json();
    return { ok: false, error: resp.error };
}

async function submitFormSimple(data: { [key: string]: string }) {
    const res = await submitForm(data);
    if (res.ok) {
        window.location.reload();
        return;
    }
    alert(`Error: ${res.error}`);
}

document.addEventListener('fetchCurrentUserDone', () => {
    if (!currentUser) {
        return;
    }
    const form = getAccountForm();
    form.newemail.value = currentUser.email;
    form.apikey.value = currentUser.apikey;
}, false);

async function submitChangePassword() {
    const form = getAccountForm();
    await submitFormSimple({ password: form.password.value });
}

async function submitChangeEmail() {
    const form = getAccountForm();
    await submitFormSimple({ email: form.email.value });
}

async function submitChangeAPIKey() {
    await submitFormSimple({ apikey: 'CHANGE' });
}

async function submitKillSessions() {
    await submitFormSimple({ loginkey: 'CHANGE' });
}

async function submitDeleteAccount() {
    alert('Not implemented yet. Please contact support@foxcav.es');
}
