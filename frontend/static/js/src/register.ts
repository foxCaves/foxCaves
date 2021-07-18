REQUIRE_GUEST = true;

function getRegisterForm() {
    return document.getElementById('register_form') as HTMLFormElement;
}

async function submitRegisterFormSimple() {
    const form = getRegisterForm();
    if (form.password_confirm.value !== form.password.value) {
        alert('Passwords do not match');
        return;
    }
    if (await submitFormSimple('/api/v1/users', 'POST', {
        username: form.username.value,
        email: form.email.value,
        password: form.password.value,
    })) {
        alert(`Successfully registered user! Please click activation link!`);
    }
}
