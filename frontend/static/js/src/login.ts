function getLoginForm() {
    return document.getElementById('login_form') as HTMLFormElement;
}

async function submitLoginFormSimple() {
    const form = getLoginForm();
    if (await submitFormSimple('/api/v1/users/@me/login', 'POST', {
        username: form.username.value,
        password: form.password.value,
    })) {
        document.location.href = "/myfiles";
    }
}
