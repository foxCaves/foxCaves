REQUIRE_GUEST = true;

function getRegisterForm() {
    return document.getElementById('register_form') as HTMLFormElement;
}

async function submitRegisterFormSimple() {
    const form = getRegisterForm();
    if (!form.agreetos.checked) {
        alert('You must read and agree to the Privacy Policy and Terms of Service');
        return;
    }
    if (form.password_confirm.value !== form.password.value) {
        alert('Passwords do not match');
        return;
    }
    if (await submitFormSimple('/api/v1/users', 'POST', {
        username: form.username.value,
        email: form.email.value,
        password: form.password.value,
        agreetos: form.agreetos.checked ? 'yes' : 'no',
    })) {
        alert(`Successfully registered user! Please click activation link!`);
    }
}
