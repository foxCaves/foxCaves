function getEmailForm() {
    return document.getElementById('email_form') as HTMLFormElement;
}

async function submitEmailFormSimple() {
    const form = getEmailForm();
    if (await submitFormSimple('/api/v1/users/emails/request', 'POST', {
        action: form.emailaction.value,
        username: form.username.value,
        email: form.email.value,
    })) {
        alert(`Successfully requested E-Mail! Please click the link you receive.`);
    }
}
