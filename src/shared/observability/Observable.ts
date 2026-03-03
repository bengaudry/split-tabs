import { Observer } from "./Observer";

export interface Observable<T extends Observable<any>> {
  addObserver(observer: Observer<T>): void;
  removeObserver(observer: Observer<T>): void;
  notifyObservers(): void;
}
