class LendTracker {
            constructor() {
                this.items = JSON.parse(localStorage.getItem('lendTracker') || '[]');
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.renderItems();
                this.updateStats();
                this.setupNotifications();
                this.checkOverdueItems();
            }

            setupEventListeners() {
                document.getElementById('lendForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addItem();
                });

                document.getElementById('enableNotifications').addEventListener('click', () => {
                    this.requestNotificationPermission();
                });
            }

            addItem() {
                const form = document.getElementById('lendForm');
                const formData = new FormData(form);
                
                const item = {
                    id: Date.now(),
                    name: formData.get('itemName'),
                    borrower: formData.get('borrowerName'),
                    contact: formData.get('borrowerContact'),
                    value: parseFloat(formData.get('itemValue')) || 0,
                    dueDate: formData.get('dueDate'),
                    notes: formData.get('notes'),
                    dateAdded: new Date().toISOString(),
                    status: 'active'
                };

                this.items.push(item);
                this.saveToStorage();
                this.renderItems();
                this.updateStats();
                this.showNotification(`${item.name} added to tracker!`);
                form.reset();
            }

            markAsReturned(id) {
                this.items = this.items.filter(item => item.id !== id);
                this.saveToStorage();
                this.renderItems();
                this.updateStats();
                this.showNotification('Item marked as returned!');
            }

            sendReminder(item) {
                const message = `Hey ${item.borrower}! Just a friendly reminder about my ${item.name}. When you get a chance, could you return it? Thanks! 😊`;
                
                if (item.contact) {
                    if (item.contact.includes('@')) {
                        // Email
                        window.open(`mailto:${item.contact}?subject=Friendly Reminder&body=${encodeURIComponent(message)}`);
                    } else {
                        // Phone
                        window.open(`sms:${item.contact}?body=${encodeURIComponent(message)}`);
                    }
                } else {
                    // Copy to clipboard
                    navigator.clipboard.writeText(message);
                    this.showNotification('Reminder message copied to clipboard!');
                }
            }

            renderItems() {
                const container = document.getElementById('itemsList');
                
                if (this.items.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">🤷‍♂️</div>
                            <p>No items being tracked yet.</p>
                            <p>Add your first borrowed item to get started!</p>
                        </div>
                    `;
                    return;
                }

                const itemsHTML = this.items.map(item => {
                    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();
                    const daysOverdue = isOverdue ? Math.ceil((new Date() - new Date(item.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
                    
                    return `
                        <div class="item">
                            <div class="item-header">
                                <div>
                                    <div class="item-title">${item.name}</div>
                                    <div class="item-borrower">Borrowed by ${item.borrower}</div>
                                </div>
                                <div class="status-badge ${isOverdue ? 'status-overdue' : 'status-active'}">
                                    ${isOverdue ? `${daysOverdue} days overdue` : 'Active'}
                                </div>
                            </div>
                            
                            <div class="item-details">
                                <div class="detail-item">
                                    <span>💰</span>
                                    <span>$${item.value.toFixed(2)}</span>
                                </div>
                                <div class="detail-item">
                                    <span>📅</span>
                                    <span>${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}</span>
                                </div>
                                <div class="detail-item">
                                    <span>📞</span>
                                    <span>${item.contact || 'No contact'}</span>
                                </div>
                                <div class="detail-item">
                                    <span>📝</span>
                                    <span>${item.notes || 'No notes'}</span>
                                </div>
                            </div>
                            
                            <div class="item-actions">
                                <button class="btn btn-warning btn-small" onclick="lendTracker.sendReminder(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                                    <span>📲</span>
                                    Send Reminder
                                </button>
                                <button class="btn btn-primary btn-small" onclick="lendTracker.markAsReturned(${item.id})">
                                    <span>✅</span>
                                    Mark Returned
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');

                container.innerHTML = itemsHTML;
            }

            updateStats() {
                const totalItems = this.items.length;
                const overdueItems = this.items.filter(item => 
                    item.dueDate && new Date(item.dueDate) < new Date()
                ).length;
                const totalValue = this.items.reduce((sum, item) => sum + item.value, 0);

                document.getElementById('totalItems').textContent = totalItems;
                document.getElementById('overdueItems').textContent = overdueItems;
                document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
            }

            checkOverdueItems() {
                const overdue = this.items.filter(item => 
                    item.dueDate && new Date(item.dueDate) < new Date()
                );

                if (overdue.length > 0 && Notification.permission === 'granted') {
                    new Notification('Lend Tracker', {
                        body: `You have ${overdue.length} overdue item(s) to follow up on!`,
                        icon: '📋'
                    });
                }
            }

            requestNotificationPermission() {
                if ('Notification' in window) {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            this.showNotification('Notifications enabled! You\'ll get alerts for overdue items.');
                        } else {
                            this.showNotification('Notifications not enabled. You can still track items manually.');
                        }
                    });
                }
            }

            setupNotifications() {
                if ('Notification' in window && Notification.permission === 'granted') {
                    // Check for overdue items every hour
                    setInterval(() => {
                        this.checkOverdueItems();
                    }, 3600000);
                }
            }

            showNotification(message) {
                const notification = document.getElementById('notification');
                const text = document.getElementById('notificationText');
                
                text.textContent = message;
                notification.classList.add('show');
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            }

            saveToStorage() {
                localStorage.setItem('lendTracker', JSON.stringify(this.items));
            }
        }

        // Initialize the app
        const lendTracker = new LendTracker();

        // Set minimum date to today
        document.getElementById('dueDate').min = new Date().toISOString().split('T')[0];