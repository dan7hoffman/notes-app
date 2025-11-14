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
- ✅ Type-safe CRUD operations (zero `any` casts)
- ✅ Strict immutability enforcement
- ✅ Robust error handling (quota exceeded, corrupted data)
- ✅ Proper object comparison (no JSON.stringify)
- ✅ Unidirectional data flow (no two-way binding)
- ✅ Single Responsibility Principle (SRP)
- ✅ Centralized constants (no magic strings)
- ✅ SSR-friendly (platform checks)
- ✅ Date serialization handling
- ✅ Enum-driven type safety

---

## 🏗️ Architecture

```
src/app/domains/task/
├── data/
│   └── task.repository.ts          # Data persistence with error handling
├── service/
│   ├── task.service.ts             # CRUD orchestration
│   ├── taskState.service.ts        # Reactive state + business logic
│   └── taskHistory.service.ts      # History management (SRP)
├── presentation/
│   ├── task/                       # Container component
│   ├── task-add/                   # Form component (signal-based)
│   ├── task-list/                  # List view with filters
│   └── task-kanban/                # Drag-drop board (dumb layer)
├── task.model.ts                   # Domain models & types
└── task.constants.ts               # Centralized constants

src/app/shared/utils/
├── date-formatter.util.ts          # Date formatting
├── json-serialization.util.ts      # Date serialization
└── object-comparison.util.ts       # Deep equality (no JSON.stringify)
```

### **Layer Responsibilities**

| Layer | Purpose | Technologies |
|-------|---------|-------------|
| **Data** | Persistence abstraction | localStorage, JSON serialization |
| **Service** | Business logic & state | Signals, computed signals, CRUD |
| **Presentation** | UI components | Standalone components, CDK |

---

## ⚡ Recent Architectural Improvements

The task domain has been comprehensively refactored to implement **10 production-grade patterns**:

### **1. Robust Error Handling**
Try/catch blocks around all localStorage operations prevent silent failures. Handles quota exceeded, corrupted data, and access failures gracefully.

### **2. Full Type Safety**
Zero `any` casts throughout the codebase. All types properly defined and leveraged for compile-time safety.

### **3. Correct Object Comparison**
Custom `deepEquals()` utility replaces unreliable `JSON.stringify()` for proper change detection with Date objects and arrays.

### **4. Efficient Data Derivation**
Computed signals ensure derived state (filters, counts, metrics) only recalculates when dependencies change.

### **5. Consistent State Paradigm**
Pure signal-based unidirectional data flow. Removed all `[(ngModel)]` in favor of explicit `[value]`/`(input)` bindings.

### **6. Clean Code**
Zero `console.log` statements in production code. Development artifacts removed.

### **7. Enforce Immutability**
All state operations create new objects/arrays. No mutations anywhere (`.map()`, `.filter()`, spread operators).

### **8. Isolate History Logic (SRP)**
Dedicated `TaskHistoryService` handles all history operations. TaskService acts as a focused orchestrator.

### **9. Centralize Constants**
`task.constants.ts` eliminates magic strings. All configuration values centralized for maintainability.

### **10. Dumb Presentation Layer**
Components delegate business logic to services. Pure presentation logic only (rendering, event delegation).

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

### **Immutable State Updates**
```typescript
// ❌ BAD: Mutates existing array
toggleTag(tag: TaskTags) {
  this.tags.push(tag)  // Mutation!
}

// ✅ GOOD: Creates new array
toggleTag(tag: TaskTags) {
  const currentTags = this.newTags()
  this.newTags.set([...currentTags, tag])  // Immutable
}
```

### **Error Handling Pattern**
```typescript
saveAll(tasks: Task[]): boolean {
  try {
    const tasksCopy = tasks.map(task => ({ ...task }))
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasksCopy))
    return true
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded')
    }
    return false  // Graceful degradation
  }
}
```

---

## 🎓 Learning Path

### **Beginner**
1. Study `task.model.ts` - domain modeling with TypeScript
2. Review `task.constants.ts` - centralized configuration pattern
3. Read `task.repository.ts` - repository pattern with error handling
4. Explore `task.service.ts` - CRUD orchestration

### **Intermediate**
5. Analyze `taskState.service.ts` - signals + business logic
6. Study `taskHistory.service.ts` - Single Responsibility Principle
7. Review `object-comparison.util.ts` - proper deep equality
8. Examine `task-add.component.ts` - signal-based forms
9. Study `task-list.component.ts` - filtering & computed signals

### **Advanced**
10. Examine `task-kanban.component.ts` - CDK drag-drop + dumb components
11. Understand immutability patterns throughout
12. Study history tracking implementation
13. Analyze revert/undo functionality
14. Review error handling strategies

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
| **Repository** | `task.repository.ts` | Abstract storage with error handling |
| **Service Layer** | `task.service.ts` | CRUD orchestration |
| **State Management** | `taskState.service.ts` | Centralized reactive state + business logic |
| **Single Responsibility** | `taskHistory.service.ts` | Dedicated history management |
| **Container/Presenter** | Task components | Separation of concerns (dumb UI) |
| **Computed Properties** | Signals | Efficient derived state |
| **Immutability** | All layers | Spread operators, no mutations |
| **Constants Pattern** | `task.constants.ts` | No magic strings |
| **Deep Equality** | `object-comparison.util.ts` | Proper change detection |
| **Unidirectional Data Flow** | Components | Explicit bindings, no `[(ngModel)]` |
| **Audit Log** | History tracking | Compliance & debugging |
| **Soft Delete** | `deleted` flag | Data recovery |
| **Error Boundary** | Repository layer | Graceful localStorage failures |

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

### **Why Immutability?**
- ✅ Predictable state changes
- ✅ Easier debugging (state never mutates unexpectedly)
- ✅ Enables time-travel debugging
- ✅ Prevents unintended side effects
- ✅ Better performance with change detection

### **Why Single Responsibility?**
- ✅ Services stay focused (TaskHistoryService vs TaskService)
- ✅ Easier to test in isolation
- ✅ Simpler to reason about
- ✅ More maintainable over time

### **Why Domain Structure?**
- ✅ All task code in one place
- ✅ Easy to find related files
- ✅ Could extract to library
- ✅ Team can own entire domain

---

## 🚧 Future Enhancements

- [ ] Backend API integration
- [ ] Real-time sync (WebSockets)
- [ ] Enhanced Undo/Redo stack (beyond history revert)
- [ ] Keyboard shortcuts
- [ ] Export to CSV/JSON
- [ ] Task attachments
- [ ] Subtasks / hierarchies
- [ ] Due dates & reminders
- [ ] Unit & integration tests
- [ ] Optimistic updates pattern

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

`angular` `typescript` `signals` `clean-architecture` `crud` `drag-drop` `state-management` `domain-driven-design` `immutability` `single-responsibility` `error-handling` `type-safety` `unidirectional-data-flow` `learning` `reference` `best-practices` `production-ready`
