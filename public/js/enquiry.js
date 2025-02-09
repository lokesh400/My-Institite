
function filterEnquiries(status, element) {
    document.querySelectorAll('.enquiry-item').forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    // Remove 'active' class from all buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add 'active' class to the clicked button
    element.classList.add('active');
}

// Toggle Status Function
async function toggleStatus(enquiryId) {
    try {
        const response = await fetch(`/update-enquiry/${enquiryId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const updatedEnquiry = await response.json();
            const row = document.querySelector(`.enquiry-item[data-id='${enquiryId}']`);
            const statusBadge = row.querySelector('.status-badge');
            const toggleBtn = row.querySelector('button i');

            // Update UI
            row.dataset.status = updatedEnquiry.openStatus ? 'open' : 'closed';
            statusBadge.textContent = updatedEnquiry.openStatus ? 'Open' : 'Closed';
            statusBadge.className = updatedEnquiry.openStatus
                ? 'status-badge px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800'
                : 'status-badge px-2 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800';
            
            toggleBtn.className = updatedEnquiry.openStatus ? 'fas fa-toggle-on' : 'fas fa-toggle-off';
        }
    } catch (error) {
        console.error('Error updating enquiry status:', error);
    }
}