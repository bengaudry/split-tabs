import { Observable } from "./Observable";

export interface Observer<T extends Observable<any>> {
  update(o: T): void;
}
