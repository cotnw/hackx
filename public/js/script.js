window.onload = function() {
    if (localStorage.getItem('name') !== undefined) {
        console.log(localStorage.getItem('name'));
        document.getElementById('name').value = localStorage.getItem('name');
    }
};