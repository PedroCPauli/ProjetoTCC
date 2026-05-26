import {
  forwardRef,
  useState
} from "react";

import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View
} from "react-native";

import {
  MaterialIcons
} from "@expo/vector-icons";

interface InputProps extends TextInputProps {

  label: string;

  obrigatorio?: boolean;

  icon?: keyof typeof MaterialIcons.glyphMap;

  secureTextEntry?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(

  (
    {
      label,
      obrigatorio,
      icon,
      secureTextEntry,
      value,
      ...rest
    },
    ref
  ) => {

    const [isFocused, setIsFocused] =
      useState(false);

    const [showPassword, setShowPassword] =
      useState(false);

    const animated =
      useState(
        new Animated.Value(
          value ? 1 : 0
        )
      )[0];

    const handleFocus = () => {

      setIsFocused(true);

      Animated.timing(animated, {

        toValue: 1,

        duration: 180,

        useNativeDriver: false

      }).start();
    };

    const handleBlur = () => {

      setIsFocused(false);

      if (!value) {

        Animated.timing(animated, {

          toValue: 0,

          duration: 180,

          useNativeDriver: false

        }).start();
      }
    };

    const labelStyle = {

      top: animated.interpolate({

        inputRange: [0, 1],

        outputRange: [18, -10]
      }),

      left: animated.interpolate({

        inputRange: [0, 1],

        outputRange: [16, 12]
      }),

      fontSize: animated.interpolate({

        inputRange: [0, 1],

        outputRange: [15, 12]
      })
    };

    return (

      <View style={styles.container}>

        <Animated.Text

          style={[

            styles.label,

            labelStyle,

            {
              color: isFocused
                ? "#2563EB"
                : "#64748B"
            }

          ]}
        >

          {label}

          {obrigatorio && (
            <Text style={styles.required}>
              {" "}*
            </Text>
          )}

        </Animated.Text>

        <View

          style={[

            styles.inputContainer,

            isFocused &&
            styles.inputFocused

          ]}
        >

          {icon && (

            <MaterialIcons

              name={icon}

              size={22}

              color={
                isFocused
                  ? "#2563EB"
                  : "#94A3B8"
              }

              style={styles.icon}
            />
          )}

          <TextInput

            ref={ref}

            value={value}

            style={styles.input}

            placeholderTextColor="#94A3B8"

            secureTextEntry={
              secureTextEntry &&
              !showPassword
            }

            onFocus={handleFocus}

            onBlur={handleBlur}

            {...rest}
          />

          {secureTextEntry && (

            <TouchableOpacity

              onPress={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >

              <MaterialIcons

                name={
                  showPassword
                    ? "visibility"
                    : "visibility-off"
                }

                size={22}

                color="#94A3B8"
              />

            </TouchableOpacity>
          )}

        </View>

      </View>
    );
  }
);

const styles = StyleSheet.create({

  container: {
    marginBottom: 24
  },

  label: {

    position: "absolute",

    backgroundColor: "#fff",

    paddingHorizontal: 6,

    zIndex: 10,

    fontWeight: "600"
  },

  required: {
    color: "#EF4444"
  },

  inputContainer: {

    height: 62,

    borderWidth: 1.5,

    borderColor: "#CBD5E1",

    borderRadius: 18,

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 16,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 2
    },

    shadowOpacity: 0.03,

    shadowRadius: 4,

    elevation: 2
  },

  inputFocused: {

    borderColor: "#2563EB",

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 4
    },

    shadowOpacity: 0.12,

    shadowRadius: 8,

    elevation: 5
  },

  icon: {
    marginRight: 2
  },

  input: {

    flex: 1,

    fontSize: 16,

    color: "#1E293B",

    fontWeight: "500",

    paddingTop: 4
  }
});