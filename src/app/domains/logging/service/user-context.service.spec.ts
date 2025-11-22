import { TestBed } from '@angular/core/testing';
import { UserContextService } from './user-context.service';

describe('UserContextService', () => {
  let service: UserContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have anonymous as default userId', () => {
      expect(service.userId()).toBe('anonymous');
    });

    it('should have a generated sessionId', () => {
      const sessionId = service.sessionId();
      expect(sessionId).toBeTruthy();
      expect(sessionId.startsWith('sess_')).toBeTrue();
    });

    it('should return context with userId and sessionId', () => {
      const context = service.getContext();
      expect(context.userId).toBe('anonymous');
      expect(context.sessionId).toBeTruthy();
      expect(context.metadata).toEqual({});
    });
  });

  describe('setUser', () => {
    it('should update userId', () => {
      service.setUser('user-123');
      expect(service.userId()).toBe('user-123');
    });

    it('should update userId and metadata', () => {
      service.setUser('user-456', { role: 'admin' });
      expect(service.userId()).toBe('user-456');
      expect(service.getContext().metadata).toEqual({ role: 'admin' });
    });

    it('should preserve sessionId when setting user', () => {
      const originalSessionId = service.sessionId();
      service.setUser('user-789');
      expect(service.sessionId()).toBe(originalSessionId);
    });
  });

  describe('clearUser', () => {
    it('should reset userId to anonymous', () => {
      service.setUser('user-123');
      service.clearUser();
      expect(service.userId()).toBe('anonymous');
    });

    it('should clear metadata', () => {
      service.setUser('user-123', { role: 'admin' });
      service.clearUser();
      expect(service.getContext().metadata).toEqual({});
    });

    it('should generate new sessionId', () => {
      const originalSessionId = service.sessionId();
      service.clearUser();
      expect(service.sessionId()).not.toBe(originalSessionId);
    });
  });

  describe('updateMetadata', () => {
    it('should merge metadata with existing', () => {
      service.setUser('user-123', { role: 'admin' });
      service.updateMetadata({ department: 'engineering' });

      const metadata = service.getContext().metadata;
      expect(metadata).toEqual({
        role: 'admin',
        department: 'engineering'
      });
    });

    it('should override existing keys', () => {
      service.setUser('user-123', { role: 'admin' });
      service.updateMetadata({ role: 'superadmin' });

      expect(service.getContext().metadata).toEqual({ role: 'superadmin' });
    });
  });

  describe('refreshSession', () => {
    it('should generate new sessionId', () => {
      const originalSessionId = service.sessionId();
      service.refreshSession();
      expect(service.sessionId()).not.toBe(originalSessionId);
    });

    it('should preserve userId and metadata', () => {
      service.setUser('user-123', { role: 'admin' });
      service.refreshSession();
      expect(service.userId()).toBe('user-123');
      expect(service.getContext().metadata).toEqual({ role: 'admin' });
    });
  });

  describe('context signal', () => {
    it('should be reactive to user changes', () => {
      const contexts: string[] = [];

      // Initial
      contexts.push(service.context().userId);

      // After setUser
      service.setUser('user-123');
      contexts.push(service.context().userId);

      // After clearUser
      service.clearUser();
      contexts.push(service.context().userId);

      expect(contexts).toEqual(['anonymous', 'user-123', 'anonymous']);
    });
  });
});
