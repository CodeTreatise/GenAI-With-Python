// Sidebar Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'sidebar-toggle';
  toggleBtn.innerHTML = '◀';
  toggleBtn.title = 'Toggle Sidebar';
  toggleBtn.setAttribute('aria-label', 'Toggle Sidebar');
  
  document.body.appendChild(toggleBtn);
  
  // Check saved state
  const isHidden = localStorage.getItem('sidebar-hidden') === 'true';
  if (isHidden) {
    document.body.classList.add('sidebar-hidden');
    toggleBtn.innerHTML = '▶';
  }
  
  // Toggle handler
  toggleBtn.addEventListener('click', function() {
    document.body.classList.toggle('sidebar-hidden');
    const hidden = document.body.classList.contains('sidebar-hidden');
    toggleBtn.innerHTML = hidden ? '▶' : '◀';
    localStorage.setItem('sidebar-hidden', hidden);
  });
});
