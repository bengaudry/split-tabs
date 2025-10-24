import { Searchbar } from "./Searchbar";
import { changeCssVariableValue } from "./utils/colors";
import { MIN_VIEW_PERCENTAGE } from "./utils/constants";
import { View } from "./View";

export type Orientation = "horizontal" | "vertical";

export class SplitView {
  private orientation: Orientation = "horizontal";

  private leftSplit: View;
  private rightSplit: View;

  private isUserResizingViews = false;

  constructor() {
    Searchbar.initialize();

    this.leftSplit = new View(null, 50, "left");
    this.rightSplit = new View(null, 50, "right");

    // Handle resizing state
    const resizeDraggableRef = SplitView.getResizeDraggableRef();
    if (resizeDraggableRef) {
      resizeDraggableRef?.addEventListener("mousedown", () => {
        this.isUserResizingViews = true;
      });
      resizeDraggableRef?.addEventListener("mouseup", () => {
        this.isUserResizingViews = false;
      });
    }

    document.addEventListener("mousemove", (e) => {
      if (this.isUserResizingViews && e.buttons == 1) {
        // check if the user is pressing the mouse btn
        const leftPercent = Math.round(
          this.orientation === "horizontal"
            ? (e.pageX * 100) / window.innerWidth
            : (e.pageY * 100) / window.innerHeight
        );
        const rightPercent = 100 - leftPercent;
        if (
          leftPercent >= MIN_VIEW_PERCENTAGE &&
          rightPercent >= MIN_VIEW_PERCENTAGE
        ) {
          this.leftSplit.updateSize(leftPercent);
          this.rightSplit.updateSize(rightPercent);
        }
      }
    });
  }

  public setOrientation(orientation?: Orientation) {
    if (!orientation) {
      orientation =
        this.orientation === "horizontal" ? "vertical" : "horizontal";
    }
    this.orientation = orientation;

    changeCssVariableValue(
      "--view-orientation",
      "vertical" === orientation ? "column" : "row"
    );
    document.body?.classList.toggle("horizontal", "horizontal" === orientation);
    document.body?.classList.toggle("vertical", "vertical" === orientation);
  }

  public getOrientation(): Orientation {
    return this.orientation;
  }

  private static getResizeDraggableRef() {
    return document.querySelector<HTMLDivElement>("#resize-draggable");
  }

  public getInstanceOfSide(side: "left" | "right"): View {
    if ("left" === side) return this.leftSplit;
    return this.rightSplit;
  }

  public loadUrl(side: "left" | "right", url: string) {
    this.getInstanceOfSide(side).loadUrl(url);
  }
}
