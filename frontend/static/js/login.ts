REQUIRE_GUEST = true;

function getLoginForm() {
    return document.getElementById('login_form') as HTMLFormElement;
}

async function submitLoginFormSimple() {
    const form = getLoginForm();
    if (await submitFormSimple('/api/v1/users/sessions/login', 'POST', {
        username: form.username.value,
        password: form.password.value,
        remember: form.remember.checked ? 'true' : 'false',
    })) {
        document.location.href = "/files";
    }
}
