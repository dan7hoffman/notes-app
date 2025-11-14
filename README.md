# Notes App - Angular Learning Repository

> **Educational Reference:** Clean 3-layer architecture with modern Angular signals, CRUD operations, Kanban board, and audit history.

[![Angular](https://img.shields.io/badge/Angular-18-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📚 Purpose

This is a **learning-focused repository** demonstrating production-ready Angular patterns through iterative development. Built as a reference for clean architecture, modern signals, and domain-driven design.

## 🎯 What You'll Learn

### **Architecture Patterns**
- ✅ 3-layer architecture (Data → Service → Presentation)
- ✅ Domain-driven structure (vertical slices)
- ✅ Separation of concerns
- ✅ Repository pattern for data abstraction

### **Modern Angular (v16+)**
- ✅ Signals for reactive state management
- ✅ Computed signals for derived state
- ✅ Standalone components
- ✅ Signal-based component communication
- ✅ Effect for reactive side effects

### **Advanced Features**
- ✅ Audit trail / history tracking
- ✅ Soft delete pattern
- ✅ Time-travel debugging (revert to previous state)
- ✅ Multi-view presentation (List, Kanban, Metrics)
- ✅ Drag-and-drop with Angular CDK
- ✅ Multi-select with checkboxes

### **Production Patterns**
- ✅ Type-safe CRUD operations
- ✅ Immutable state updates
- ✅ SSR-friendly (platform checks)
- ✅ Date serialization handling
- ✅ Enum-driven type safety

---

## 🏗️ Architecture

```
src/app/domains/task/
├── data/
│   └── task.repository.ts        # Data persistence (localStorage)
├── service/
│   ├── task.service.ts           # Business logic & CRUD
│   └── taskState.service.ts      # Reactive state management
├── presentation/
│   ├── task/                     # Container component
│   ├── task-add/                 # Form component
│   ├── task-list/                # List view with filters
│   └── task-kanban/              # Drag-drop board
└── task.model.ts                 # Domain models
```

### **Layer Responsibilities**

| Layer | Purpose | Technologies |
|-------|---------|-------------|
| **Data** | Persistence abstraction | localStorage, JSON serialization |
| **Service** | Business logic & state | Signals, computed signals, CRUD |
| **Presentation** | UI components | Standalone components, CDK |

---

## 🚀 Key Features

### **1. Task Management**
- Create, read, update, delete tasks
- Status tracking (Pending → In Progress → Completed)
- Priority levels (Low, Medium, High)
- Multi-tag support (Bug, Risk, Feature)

### **2. Audit History**
Every change is tracked:
```typescript
history: [{
  modifiedAt: Date,
  changes: {
    status: { oldValue: 'pending', newValue: 'in-progress' }
  }
}]
```

### **3. Multiple Views**
- **List View:** Filterable task list with full history
- **Kanban Board:** Drag-and-drop columns with sorting
- **Metrics Dashboard:** Real-time computed statistics

### **4. Reactive State**
```typescript
// Single source of truth
private _tasks = signal<Task[]>([])

// Computed derived state
readonly completionRate = computed(() => {
  const total = this._tasks().length
  const completed = this.completedTaskCount()
  return ((completed / total) * 100).toFixed(1) + '%'
})
```

---

## 📖 Code Examples

### **Creating a Task**
```typescript
this.taskService.add({
  title: 'Fix login bug',
  content: 'Users cannot login with special characters',
  status: TaskStatus.Pending,
  priority: TaskPriority.High,
  tags: [TaskTags.Bug]
})
```

### **Computed Signal Usage**
```typescript
export class TaskComponent {
  // Reference the signal (don't call it)
  taskCount = this.taskState.taskCount

  // Template automatically unwraps with ()
  // <span>{{ taskCount() }}</span>
}
```

### **Drag & Drop Status Update**
```typescript
drop(event: CdkDragDrop<any>, newStatus: TaskStatus) {
  const task = event.item.data
  if (task.status !== newStatus) {
    this.taskService.update(task.id, { status: newStatus })
  }
}
```

---

## 🎓 Learning Path

### **Beginner**
1. Study `task.model.ts` - understand domain modeling
2. Read `task.repository.ts` - see repository pattern
3. Explore `task.service.ts` - CRUD operations

### **Intermediate**
4. Analyze `taskState.service.ts` - signals architecture
5. Review `task-add.component.ts` - form patterns
6. Study `task-list.component.ts` - filtering & computed signals

### **Advanced**
7. Examine `task-kanban.component.ts` - CDK drag-drop
8. Understand history tracking implementation
9. Study revert/undo functionality

---

## 🛠️ Technical Stack

- **Angular** 18+ (standalone components)
- **TypeScript** 5.0+
- **Angular CDK** (drag-drop)
- **Signals API** (reactive state)
- **localStorage** (persistence)

---

## 📦 Project Structure

```
notes-app/
├── src/app/
│   ├── domains/
│   │   ├── task/          # Task domain (complete)
│   │   └── notes/         # Notes domain (planned)
│   ├── shared/
│   │   └── utils/         # Date formatting, serialization
│   └── layout/            # Header, sidebar, footer
└── README.md
```

---

## 🔄 Data Flow

```
User Action (Component)
    ↓
TaskService (Business Logic)
    ↓
TaskRepository (Persistence)
    ↓
TaskStateService (State Update)
    ↓
Computed Signals Update
    ↓
Components Auto-Render
```

**Unidirectional flow** ensures predictable state updates.

---

## 🎯 Design Patterns Used

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Repository** | `task.repository.ts` | Abstract storage |
| **Service Layer** | `task.service.ts` | Business logic isolation |
| **State Management** | `taskState.service.ts` | Centralized reactive state |
| **Container/Presenter** | Task components | Separation of concerns |
| **Computed Properties** | Signals | Derived state |
| **Audit Log** | History tracking | Compliance & debugging |
| **Soft Delete** | `deleted` flag | Data recovery |

---

## 📝 Key Learnings

### **Why Signals Over RxJS?**
- ✅ Simpler mental model (no subscriptions)
- ✅ Automatic cleanup
- ✅ Fine-grained reactivity
- ✅ Better performance

### **Why 3 Layers?**
- ✅ Easy to test (mock each layer)
- ✅ Swap implementations (localStorage → HTTP)
- ✅ Clear responsibilities
- ✅ Scalable architecture

### **Why Domain Structure?**
- ✅ All task code in one place
- ✅ Easy to find related files
- ✅ Could extract to library
- ✅ Team can own entire domain

---

## 🚧 Future Enhancements

- [ ] Backend API integration
- [ ] Real-time sync (WebSockets)
- [ ] Undo/Redo stack
- [ ] Keyboard shortcuts
- [ ] Export to CSV/JSON
- [ ] Task attachments
- [ ] Subtasks / hierarchies
- [ ] Due dates & reminders

---

## 💻 Development

### Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

### Build
Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

---

## 📚 Resources

- [Angular Signals Guide](https://angular.io/guide/signals)
- [Angular CDK Drag & Drop](https://material.angular.io/cdk/drag-drop/overview)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

## 🤝 Contributing

This is a learning repository. Feel free to:
- Fork and experiment
- Open issues with questions
- Submit PRs with improvements
- Use as a reference for your projects

---

## 📄 License

MIT License - Feel free to use this code for learning and reference.

---

## 🎓 Author

**Daniel Hoffman** ([@dan7hoffman](https://github.com/dan7hoffman))

*Built as an iterative learning exercise to master Angular patterns and clean architecture.*

---

## 🔖 Tags

`angular` `typescript` `signals` `clean-architecture` `crud` `drag-drop` `state-management` `domain-driven-design` `learning` `reference` `best-practices`
