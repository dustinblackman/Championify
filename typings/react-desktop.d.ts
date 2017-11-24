declare module "react-desktop" {
  import { Component, ComponentState, MouseEventHandler } from "react";

  type OnClickHandler = <T>(event: MouseEventHandler<T>) => void;

  interface TitleBarProps {
    title?: string;
    controls?: boolean;
    inset?: boolean;
    transparent?: boolean;
    isFullscreen?: boolean;
    onCloseClick?: OnClickHandler;
    onMinimizeClick?: OnClickHandler;
    onMaximizeClick?: OnClickHandler;
    onResizeClick?: OnClickHandler;
  }

  export class TitleBar extends Component<TitleBarProps, ComponentState> {}
}
