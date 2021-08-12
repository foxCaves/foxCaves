$(async () => {
    const params = new URLSearchParams(document.location.search);
    const res = await fetch('/api/v1/users/emails/code', {
        body: params,
        method: 'POST',
    });
    const data = await res.json();
    if (res.status !== 200) {
        alert('Error: ' + data.error);
        return;
    }
    switch (data.action) {
        case 'forgotpwd':
            alert('New password has been E-Mailed to you!');
            document.location.href = '/login';
            break;
        case 'activation':
            alert('Account activated. Please log in.');
            document.location.href = '/login';
            break;
    }
});
