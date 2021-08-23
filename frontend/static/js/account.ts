REQUIRE_LOGGED_IN = true;

function getAccountForm() {
    return document.getElementById('account_form') as HTMLFormElement;
}

async function submitAccountFormSimple(data: { [key: string]: string }, method: string = 'PATCH') {
    const form = getAccountForm();
    data.current_password = form.current_password.value;
    if (await submitFormSimple(`/api/v1/users/${currentUser!.id}`, method, data)) {
        document.location.reload();
    }
}

document.addEventListener('fetchCurrentUserDone', () => {
    const form = getAccountForm();
    form.username.value = currentUser!.username;
    form.newemail.value = currentUser!.email;
    form.apikey.value = currentUser!.apikey;
}, false);

async function submitChangePassword() {
    const form = getAccountForm();
    if (form.password_confirm.value !== form.password.value) {
        alert('Passwords do not match');
        return;
    }
    await submitAccountFormSimple({ password: form.password.value });
}

async function submitChangeEmail() {
    const form = getAccountForm();
    await submitAccountFormSimple({ email: form.email.value });
}

async function submitChangeAPIKey() {
    await submitAccountFormSimple({ apikey: 'CHANGE' });
}

async function submitKillSessions() {
    await submitAccountFormSimple({ loginkey: 'CHANGE' });
}

async function submitDeleteAccount() {
    if (confirm('Are you sure you want to delete your account?\nThis is IRREVERSIBLE!')) {
        await submitAccountFormSimple({}, 'DELETE');
    }
}
