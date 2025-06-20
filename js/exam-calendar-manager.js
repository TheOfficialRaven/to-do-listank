/**
 * ===========================================
 * VIZSGANAPTÁR KEZELŐ (EXAM CALENDAR MANAGER)
 * ===========================================
 * 
 * Felelős a diákok vizsganaptár kezeléséért:
 * - Vizsgák hozzáadása, szerkesztése, törlése
 * - Firebase szinkronizáció
 * - Naptári megjelenítés és rendezés
 * - Emlékeztetők és küldetések integrációja
 */

class ExamCalendarManager {
    constructor() {
        this.exams = [];
        this.currentFilter = 'all';
        this.editingExamId = null;
        
        this.init();
    }

    async init() {
        console.log('🎓 Vizsganaptár inicializálása...');
        
        // Várunk arra, hogy Firebase auth és database elkészüljön
        await this.waitForFirebase();
        
        this.bindEvents();
        this.setupTabVisibility();
        
        // Csak akkor töltjük be az adatokat, ha van bejelentkezett felhasználó
        if (firebase.auth().currentUser) {
            await this.loadExams();
        }
    }
    
    waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebase && firebase.auth && firebase.database) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    bindEvents() {
        // Form megjelenítés/elrejtés
        const newExamBtn = document.getElementById('new-exam-btn');
        const addFirstExamBtn = document.getElementById('add-first-exam');
        const cancelExamFormBtn = document.getElementById('cancel-exam-form');
        const cancelExamBtn = document.getElementById('cancel-exam');

        if (newExamBtn) {
            newExamBtn.addEventListener('click', () => this.showExamForm());
        }
        
        if (addFirstExamBtn) {
            addFirstExamBtn.addEventListener('click', () => this.showExamForm());
        }

        if (cancelExamFormBtn) {
            cancelExamFormBtn.addEventListener('click', () => this.hideExamForm());
        }

        if (cancelExamBtn) {
            cancelExamBtn.addEventListener('click', () => this.hideExamForm());
        }

        // Vizsga mentése
        const saveExamBtn = document.getElementById('save-exam');
        if (saveExamBtn) {
            saveExamBtn.addEventListener('click', () => this.saveExam());
        }

        // Szűrő változás
        const filterSelect = document.getElementById('exam-filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderExams();
            });
        }

        // Modal események
        this.bindModalEvents();

        // Target group változás figyelése
        document.addEventListener('targetGroupChanged', () => {
            this.setupTabVisibility();
        });
    }

    bindModalEvents() {
        // Szerkesztő modal események
        const editModal = document.getElementById('exam-edit-modal');
        const editModalClose = document.getElementById('exam-edit-modal-close');
        const updateExamBtn = document.getElementById('update-exam');
        const deleteExamBtn = document.getElementById('delete-exam');
        const cancelEditBtn = document.getElementById('cancel-exam-edit');

        if (editModalClose) {
            editModalClose.addEventListener('click', () => this.hideEditModal());
        }

        if (updateExamBtn) {
            updateExamBtn.addEventListener('click', () => this.updateExam());
        }

        if (deleteExamBtn) {
            deleteExamBtn.addEventListener('click', () => this.deleteExam());
        }

        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.hideEditModal());
        }

        // Modal háttér kattintás
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    this.hideEditModal();
                }
            });
        }
    }

    setupTabVisibility() {
        // Csak diák target group esetén látható
        const examTab = document.querySelector('[data-tab="exam-calendar"]');
        const examSection = document.getElementById('exam-calendar-section');
        const targetGroup = window.advancedTargetGroupSystem?.getCurrentTargetGroup();
        const bodyHasStudentClass = document.body.classList.contains('target-group-student');
        const isStudent = targetGroup?.id === 'student' || bodyHasStudentClass;

        console.log(`📚 Exam calendar visibility check: isStudent=${isStudent} (targetGroup: ${targetGroup?.id}, bodyClass: ${bodyHasStudentClass})`);

        if (examTab && examSection) {
            if (isStudent) {
                examTab.style.display = '';
                examSection.classList.remove('hidden');
                console.log('📚 Exam calendar made visible for student');
            } else {
                examTab.style.display = 'none';
                examSection.classList.add('hidden');
                console.log('📚 Exam calendar hidden for non-student');
            }
        }
    }

    showExamForm() {
        const form = document.getElementById('exam-form');
        if (form) {
            form.style.display = 'block';
            form.classList.add('show');
            
            // Alapértelmezett dátum beállítása (holnap)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateInput = document.getElementById('exam-date');
            if (dateInput) {
                dateInput.value = tomorrow.toISOString().split('T')[0];
            }

            // Első mező fókusz
            const subjectInput = document.getElementById('exam-subject');
            if (subjectInput) {
                subjectInput.focus();
            }
        }
    }

    hideExamForm() {
        const form = document.getElementById('exam-form');
        if (form) {
            form.style.display = 'none';
            form.classList.remove('show');
            this.clearForm();
        }
    }

    clearForm() {
        const form = document.getElementById('exam-form');
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.type === 'select-one') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }
    }

    async saveExam() {
        const subject = document.getElementById('exam-subject')?.value?.trim();
        const type = document.getElementById('exam-type')?.value;
        const date = document.getElementById('exam-date')?.value;
        const time = document.getElementById('exam-time')?.value;
        const priority = document.getElementById('exam-priority')?.value || 'medium';
        const notes = document.getElementById('exam-notes')?.value?.trim() || '';

        // Validáció
        if (!subject || !type || !date) {
            this.showNotification('Kérjük, töltsd ki a kötelező mezőket!', 'error');
            return;
        }

        // Múltbeli dátum ellenőrzése
        const examDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (examDate < today) {
            this.showNotification('A vizsga dátuma nem lehet a múltban!', 'error');
            return;
        }

        try {
            const examData = {
                subject,
                type,
                date,
                time: time || null,
                priority,
                notes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await this.saveExamToFirebase(examData);
            this.hideExamForm();
            this.showNotification('Vizsga sikeresen hozzáadva!', 'success');
            this.loadExams();

        } catch (error) {
            console.error('Hiba a vizsga mentése során:', error);
            this.showNotification('Hiba történt a vizsga mentése során!', 'error');
        }
    }

    async saveExamToFirebase(examData) {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Nincs bejelentkezett felhasználó');

        const db = firebase.database();
        const examRef = db.ref(`users/${user.uid}/exams`).push();
        
        return examRef.set({
            id: examRef.key,
            ...examData
        });
    }

    async loadExams() {
        const user = firebase.auth().currentUser;
        if (!user) {
            this.exams = [];
            this.renderExams();
            return;
        }

        try {
            const db = firebase.database();
            const snapshot = await db.ref(`users/${user.uid}/exams`).once('value');
            
            if (snapshot.exists()) {
                this.exams = Object.values(snapshot.val());
            } else {
                this.exams = [];
            }

            this.renderExams();

        } catch (error) {
            console.error('Hiba a vizsgák betöltése során:', error);
            this.exams = [];
            this.renderExams();
        }
    }

    renderExams() {
        const timeline = document.getElementById('exam-timeline');
        const emptyState = document.getElementById('exam-empty-state');

        if (!timeline || !emptyState) return;

        const filteredExams = this.filterExams();

        if (filteredExams.length === 0) {
            timeline.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        timeline.style.display = 'block';
        emptyState.style.display = 'none';

        // Hetek szerint csoportosítás
        const groupedExams = this.groupExamsByWeek(filteredExams);
        
        timeline.innerHTML = '';
        
        Object.keys(groupedExams).forEach(weekKey => {
            const weekData = groupedExams[weekKey];
            const weekElement = this.createWeekElement(weekKey, weekData);
            timeline.appendChild(weekElement);
        });
    }

    filterExams() {
        const now = new Date();
        
        return this.exams.filter(exam => {
            const examDate = new Date(exam.date);
            
            switch (this.currentFilter) {
                case 'week':
                    const nextWeek = new Date(now);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    return examDate >= now && examDate <= nextWeek;
                    
                case 'month':
                    const nextMonth = new Date(now);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    return examDate >= now && examDate <= nextMonth;
                    
                case 'high':
                    return exam.priority === 'high';
                    
                default:
                    return true;
            }
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    groupExamsByWeek(exams) {
        const groups = {};
        
        exams.forEach(exam => {
            const examDate = new Date(exam.date);
            const weekStart = this.getWeekStart(examDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const weekKey = this.formatDateRange(weekStart, weekEnd);
            
            if (!groups[weekKey]) {
                groups[weekKey] = [];
            }
            
            groups[weekKey].push(exam);
        });
        
        return groups;
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Hétfő kezdet
        return new Date(d.setDate(diff));
    }

    formatDateRange(start, end) {
        const options = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString('hu-HU', options)} - ${end.toLocaleDateString('hu-HU', options)}`;
    }

    createWeekElement(weekTitle, exams) {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'exam-week';
        
        weekDiv.innerHTML = `
            <div class="exam-week-header">
                <h4 class="exam-week-title">📅 ${weekTitle}</h4>
                <span class="exam-week-count">${exams.length} vizsga</span>
            </div>
            <div class="exam-list">
                ${exams.map(exam => this.createExamCard(exam)).join('')}
            </div>
        `;

        // Event listener hozzáadása a kártyákhoz
        weekDiv.querySelectorAll('.exam-card').forEach((card, index) => {
            const exam = exams[index];
            
            card.addEventListener('click', () => this.showEditModal(exam));
            
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showEditModal(exam);
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.confirmDeleteExam(exam);
                });
            }
        });

        return weekDiv;
    }

    createExamCard(exam) {
        const examDate = new Date(exam.date);
        const now = new Date();
        const countdown = this.getCountdown(examDate, now);
        const priorityEmoji = this.getPriorityEmoji(exam.priority);
        const typeLabel = this.getTypeLabel(exam.type);

        return `
            <div class="exam-card priority-${exam.priority}" data-exam-id="${exam.id}">
                <div class="exam-card-header">
                    <div class="exam-card-main">
                        <h5 class="exam-card-subject">${exam.subject}</h5>
                        <span class="exam-card-type">${typeLabel}</span>
                    </div>
                    <div class="exam-card-priority ${exam.priority}">
                        ${priorityEmoji} ${this.getPriorityLabel(exam.priority)}
                    </div>
                </div>
                
                <div class="exam-card-details">
                    <div class="exam-card-date">
                        📅 ${this.formatDate(examDate)}
                        ${exam.time ? `<span class="exam-card-time">🕐 ${exam.time}</span>` : ''}
                    </div>
                    <div class="exam-card-countdown ${countdown.class}">
                        ${countdown.text}
                    </div>
                </div>
                
                ${exam.notes ? `<div class="exam-card-notes">${exam.notes}</div>` : ''}
                
                <div class="exam-card-actions">
                    <button class="edit-btn">
                        <span class="material-icons">edit</span>
                        Szerkesztés
                    </button>
                    <button class="delete-btn">
                        <span class="material-icons">delete</span>
                        Törlés
                    </button>
                </div>
            </div>
        `;
    }

    getCountdown(examDate, now) {
        const diffTime = examDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: 'Elmúlt', class: 'past' };
        } else if (diffDays === 0) {
            return { text: 'Ma!', class: 'urgent' };
        } else if (diffDays === 1) {
            return { text: 'Holnap!', class: 'urgent' };
        } else if (diffDays <= 3) {
            return { text: `${diffDays} nap`, class: 'urgent' };
        } else if (diffDays <= 7) {
            return { text: `${diffDays} nap`, class: 'soon' };
        } else {
            return { text: `${diffDays} nap`, class: 'upcoming' };
        }
    }

    getPriorityEmoji(priority) {
        const emojis = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟢'
        };
        return emojis[priority] || '🟡';
    }

    getPriorityLabel(priority) {
        const labels = {
            'high': 'Magas',
            'medium': 'Közepes',
            'low': 'Alacsony'
        };
        return labels[priority] || 'Közepes';
    }

    getTypeLabel(type) {
        const labels = {
            'dolgozat': 'Dolgozat',
            'zh': 'ZH',
            'feleles': 'Felelés',
            'erettsegi': 'Érettségi',
            'vizsga': 'Vizsga',
            'prezentacio': 'Prezentáció',
            'projekt': 'Projekt beadás',
            'teszt': 'Teszt'
        };
        return labels[type] || type;
    }

    formatDate(date) {
        return date.toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showEditModal(exam) {
        this.editingExamId = exam.id;
        
        // Adatok betöltése a modal mezőibe
        document.getElementById('edit-exam-subject').value = exam.subject;
        document.getElementById('edit-exam-type').value = exam.type;
        document.getElementById('edit-exam-date').value = exam.date;
        document.getElementById('edit-exam-time').value = exam.time || '';
        document.getElementById('edit-exam-priority').value = exam.priority;
        document.getElementById('edit-exam-notes').value = exam.notes || '';

        // Modal megjelenítése
        const modal = document.getElementById('exam-edit-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideEditModal() {
        const modal = document.getElementById('exam-edit-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.editingExamId = null;
    }

    async updateExam() {
        if (!this.editingExamId) return;

        const subject = document.getElementById('edit-exam-subject')?.value?.trim();
        const type = document.getElementById('edit-exam-type')?.value;
        const date = document.getElementById('edit-exam-date')?.value;
        const time = document.getElementById('edit-exam-time')?.value;
        const priority = document.getElementById('edit-exam-priority')?.value || 'medium';
        const notes = document.getElementById('edit-exam-notes')?.value?.trim() || '';

        // Validáció
        if (!subject || !type || !date) {
            this.showNotification('Kérjük, töltsd ki a kötelező mezőket!', 'error');
            return;
        }

        try {
            const examData = {
                subject,
                type,
                date,
                time: time || null,
                priority,
                notes,
                updatedAt: new Date().toISOString()
            };

            await this.updateExamInFirebase(this.editingExamId, examData);
            this.hideEditModal();
            this.showNotification('Vizsga sikeresen frissítve!', 'success');
            this.loadExams();

        } catch (error) {
            console.error('Hiba a vizsga frissítése során:', error);
            this.showNotification('Hiba történt a vizsga frissítése során!', 'error');
        }
    }

    async updateExamInFirebase(examId, examData) {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Nincs bejelentkezett felhasználó');

        const db = firebase.database();
        return db.ref(`users/${user.uid}/exams/${examId}`).update(examData);
    }

    async deleteExam() {
        if (!this.editingExamId) return;

        try {
            await this.deleteExamFromFirebase(this.editingExamId);
            this.hideEditModal();
            this.showNotification('Vizsga sikeresen törölve!', 'success');
            this.loadExams();

        } catch (error) {
            console.error('Hiba a vizsga törlése során:', error);
            this.showNotification('Hiba történt a vizsga törlése során!', 'error');
        }
    }

    async deleteExamFromFirebase(examId) {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Nincs bejelentkezett felhasználó');

        const db = firebase.database();
        return db.ref(`users/${user.uid}/exams/${examId}`).remove();
    }

    confirmDeleteExam(exam) {
        if (confirm(`Biztosan törölni szeretnéd ezt a vizsgát?\n\n${exam.subject} - ${exam.type}\n${this.formatDate(new Date(exam.date))}`)) {
            this.editingExamId = exam.id;
            this.deleteExam();
        }
    }

    showNotification(message, type = 'info') {
        // Egyszerű notification implementáció
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Publikus API a quest generátor számára
    getUpcomingExams(days = 7) {
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + days);

        return this.exams.filter(exam => {
            const examDate = new Date(exam.date);
            return examDate >= now && examDate <= futureDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getExamsBySubject(subject) {
        return this.exams.filter(exam => 
            exam.subject.toLowerCase().includes(subject.toLowerCase())
        );
    }

    getHighPriorityExams() {
        return this.exams.filter(exam => exam.priority === 'high');
    }
}

// Globális inicializálás
window.examCalendarManager = null;

// Firebase auth változás figyelése
firebase.auth().onAuthStateChanged((user) => {
    if (user && !window.examCalendarManager) {
        window.examCalendarManager = new ExamCalendarManager();
        console.log('📚 ExamCalendarManager globálisan inicializálva');
    } else if (!user && window.examCalendarManager) {
        window.examCalendarManager = null;
        console.log('📚 ExamCalendarManager törölve (kijelentkezés)');
    }
});

// CSS animációk hozzáadása
if (!document.querySelector('#exam-animations')) {
    const style = document.createElement('style');
    style.id = 'exam-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Export a quest rendszer számára
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExamCalendarManager;
} 