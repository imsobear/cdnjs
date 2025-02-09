import _extends from "@babel/runtime/helpers/esm/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/esm/objectWithoutPropertiesLoose";
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import withStyles from '../styles/withStyles';
import Paper from '../Paper';
import capitalize from '../utils/capitalize';
import LinearProgress from '../LinearProgress';
export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: theme.palette.background.default,
    padding: 8
  },

  /* Styles applied to the root element if `position="bottom"`. */
  positionBottom: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: theme.zIndex.mobileStepper
  },

  /* Styles applied to the root element if `position="top"`. */
  positionTop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: theme.zIndex.mobileStepper
  },

  /* Styles applied to the root element if `position="static"`. */
  positionStatic: {},

  /* Styles applied to the dots container if `variant="dots"`. */
  dots: {
    display: 'flex',
    flexDirection: 'row'
  },

  /* Styles applied to each dot if `variant="dots"`. */
  dot: {
    backgroundColor: theme.palette.action.disabled,
    borderRadius: '50%',
    width: 8,
    height: 8,
    margin: '0 2px'
  },

  /* Styles applied to a dot if `variant="dots"` and this is the active step. */
  dotActive: {
    backgroundColor: theme.palette.primary.main
  },

  /* Styles applied to the Linear Progress component if `variant="progress"`. */
  progress: {
    width: '50%'
  }
});
const MobileStepper = React.forwardRef(function MobileStepper(props, ref) {
  const {
    activeStep = 0,
    backButton,
    classes,
    className,
    LinearProgressProps,
    nextButton,
    position = 'bottom',
    steps,
    variant = 'dots'
  } = props,
        other = _objectWithoutPropertiesLoose(props, ["activeStep", "backButton", "classes", "className", "LinearProgressProps", "nextButton", "position", "steps", "variant"]);

  return React.createElement(Paper, _extends({
    square: true,
    elevation: 0,
    className: clsx(classes.root, classes[`position${capitalize(position)}`], className),
    ref: ref
  }, other), backButton, variant === 'text' && React.createElement(React.Fragment, null, activeStep + 1, " / ", steps), variant === 'dots' && React.createElement("div", {
    className: classes.dots
  }, [...new Array(steps)].map((_, index) => React.createElement("div", {
    key: index,
    className: clsx(classes.dot, index === activeStep && classes.dotActive)
  }))), variant === 'progress' && React.createElement(LinearProgress, _extends({
    className: classes.progress,
    variant: "determinate",
    value: Math.ceil(activeStep / (steps - 1) * 100)
  }, LinearProgressProps)), nextButton);
});
process.env.NODE_ENV !== "production" ? MobileStepper.propTypes = {
  /**
   * Set the active step (zero based index).
   * Defines which dot is highlighted when the variant is 'dots'.
   */
  activeStep: PropTypes.number,

  /**
   * A back button element. For instance, it can be a `Button` or an `IconButton`.
   */
  backButton: PropTypes.node,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css) below for more details.
   */
  classes: PropTypes.object.isRequired,

  /**
   * @ignore
   */
  className: PropTypes.string,

  /**
   * Props applied to the `LinearProgress` element.
   */
  LinearProgressProps: PropTypes.object,

  /**
   * A next button element. For instance, it can be a `Button` or an `IconButton`.
   */
  nextButton: PropTypes.node,

  /**
   * Set the positioning type.
   */
  position: PropTypes.oneOf(['bottom', 'top', 'static']),

  /**
   * The total steps.
   */
  steps: PropTypes.number.isRequired,

  /**
   * The variant to use.
   */
  variant: PropTypes.oneOf(['text', 'dots', 'progress'])
} : void 0;
export default withStyles(styles, {
  name: 'MuiMobileStepper'
})(MobileStepper);