import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';

class SocketClient {
  private static instance: SocketClient;
  private socket: Socket | null = null;
  private locationSocket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private constructor() {}

  static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  connectToLocation(token: string): Socket {
    if (this.locationSocket?.connected) {
      return this.locationSocket;
    }

    this.locationSocket = io(`${SOCKET_URL}/location`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupLocationHandlers();
    return this.locationSocket;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('job:assigned', (data: any) => {
      console.log('Job assigned:', data);
      window.dispatchEvent(new CustomEvent('job:assigned', { detail: data }));
    });

    this.socket.on('job:status_changed', (data: any) => {
      console.log('Job status changed:', data);
      window.dispatchEvent(new CustomEvent('job:status_changed', { detail: data }));
    });

    this.socket.on('notification', (data: any) => {
      console.log('Notification received:', data);
      window.dispatchEvent(new CustomEvent('notification', { detail: data }));
    });

    this.socket.on('auth_error', () => {
      store.dispatch(logout());
      window.location.href = '/login';
    });
  }

  private setupLocationHandlers(): void {
    if (!this.locationSocket) return;

    this.locationSocket.on('connect', () => {
      console.log('Location socket connected');
    });

    this.locationSocket.on('technician:location_update', (data: any) => {
      window.dispatchEvent(new CustomEvent('technician:location_update', { detail: data }));
    });

    this.locationSocket.on('job:location_update', (data: any) => {
      window.dispatchEvent(new CustomEvent('job:location_update', { detail: data }));
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.locationSocket?.disconnect();
    this.socket = null;
    this.locationSocket = null;
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  getLocationSocket(): Socket | null {
    return this.locationSocket;
  }

  subscribeToLocationUpdates(technicianIds: string[]): void {
    this.locationSocket?.emit('subscribe', { technicianIds });
  }

  unsubscribeFromLocationUpdates(technicianIds: string[]): void {
    this.locationSocket?.emit('unsubscribe', { technicianIds });
  }
}

export const socketClient = SocketClient.getInstance();
export type { Socket };
