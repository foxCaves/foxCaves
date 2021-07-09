document.addEventListener('fetchCurrentUserDone', () => {
    const form = document.getElementById('account_form') as HTMLFormElement;
    if (!currentUser) {
        return;
    }
    form.newemail.value = currentUser.email;
    form.apikey.value = currentUser.apikey;
}, false);
