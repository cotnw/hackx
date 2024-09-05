function savePolicies() {
    var policies = document.getElementById('policyText').value;
    fetch('/dashboard/savePolicies', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ policies }),
    })
    .then(response => response.text())
    .then(data => {
        console.log('Success:', data);
        alert('Policies saved successfully');
    })
    // Here you would typically send the data back to the server
}
