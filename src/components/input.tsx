import React, { forwardRef } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

export const Input = forwardRef<TextInput, TextInputProps>(
  ({ ...rest }, ref) => {
    return (
      <TextInput
        ref={ref}
        style={styles.input}
        {...rest}
      />
    );
  }
);

const styles = StyleSheet.create({
  input: {
    height: 48,
    width: "100%",
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 10,
    fontSize: 14, 
    paddingLeft: 12
  }
});