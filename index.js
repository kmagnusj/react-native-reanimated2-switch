
import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import {
  PanGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { clamp, snapPoint } from 'react-native-redash'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'

const SWITCH_CONTAINER_WIDTH = Math.min(wp('23%'), 140)
const SWITCH_CONTAINER_HEIGHT = hp('6%')
const CIRCLE_WIDTH = hp('6%')
const BORDER = 0
const animationConfig = {
  overshootClamping: true,
}

const Switch = ({
  testID = '', value, onChange = () => { }, activeBackgroundColor = 'red',
  inactiveBackgroundColor = 'green', activeIcon = null, inactiveIcon = null, containerStyle = {}, circleStyle = {}
}) => {

  const circleWidth = containerStyle?.width / 2 || CIRCLE_WIDTH

  const TRACK_CIRCLE_WIDTH = (containerStyle?.width || SWITCH_CONTAINER_WIDTH)
    - circleWidth
    - (containerStyle?.borderWidth || BORDER) * 2

  const [isToggled, setIsToggled] = useState(value)
  const translateX = useSharedValue(isToggled ? TRACK_CIRCLE_WIDTH : 0)

  useEffect(() => {
    onChange(isToggled)
  }, [isToggled])

  const onPress = ({ nativeEvent: { state } }) => {
    if (state !== State.ACTIVE) return
    setIsToggled(prevstate => !prevstate)
    translateX.value = withSpring(isToggled ? 0 : TRACK_CIRCLE_WIDTH, animationConfig)
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        translateX.value,
        [0, TRACK_CIRCLE_WIDTH],
        [inactiveBackgroundColor, activeBackgroundColor]
      ),
    }
  })

  const onGestureEvent = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.x = translateX.value
    },
    onActive: ({ translationX }, context) => {
      translateX.value = clamp(translationX + context.x, 0, TRACK_CIRCLE_WIDTH)
    },
    onEnd: ({ velocityX }) => {
      const selectedSnapPoint = snapPoint(translateX.value, velocityX, [
        0,
        TRACK_CIRCLE_WIDTH,
      ])
      translateX.value = withSpring(selectedSnapPoint, animationConfig)
      runOnJS(setIsToggled)(selectedSnapPoint !== 0)
    },
  })

  const panRef = useRef(null)

  return (
    <TapGestureHandler testID={testID} waitFor={panRef} onHandlerStateChange={onPress}>
      <Animated.View style={[animatedContainerStyle, styles.switchContainer, containerStyle]}>
        <PanGestureHandler ref={panRef} onGestureEvent={onGestureEvent}>
          <Animated.View
            style={[animatedStyle, styles.circle, { borderColor: 'transparent', width: containerStyle?.width / 2 || CIRCLE_WIDTH, height: containerStyle?.height || CIRCLE_WIDTH }, circleStyle]}
            >
            {isToggled && activeIcon}
            {!isToggled && inactiveIcon}
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  )
}
export default Switch

const styles = StyleSheet.create({
  switchContainer: {
    width: SWITCH_CONTAINER_WIDTH,
    height: SWITCH_CONTAINER_HEIGHT,
    borderRadius: 999,
    flexDirection: 'row',
    paddingLeft: BORDER
  },
  circle: {
    alignSelf: 'center',
    width: CIRCLE_WIDTH,
    height: CIRCLE_WIDTH,
    borderRadius: 999,
    borderWidth: BORDER,
    elevation: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.48,
    shadowRadius: 11.95,
  },
})