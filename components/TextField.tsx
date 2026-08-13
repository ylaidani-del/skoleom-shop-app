import { Control, Controller, ControllerProps, FieldValues, Path } from 'react-hook-form';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface TextFieldProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  rules?: ControllerProps<T, Path<T>>['rules'];
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  rules,
  ...inputProps
}: TextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className={styles.wrapper}>
          <Text className={styles.label}>{label}</Text>
          <TextInput
            className={styles.input}
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={(value as string) ?? ''}
            {...inputProps}
          />
          {error && <Text className={styles.error}>{error.message}</Text>}
        </View>
      )}
    />
  );
}

const styles = {
  wrapper: 'mb-4',
  label: 'mb-1 text-sm font-medium text-gray-700',
  input: 'rounded-lg border border-gray-300 px-4 py-3 text-base',
  error: 'mt-1 text-sm text-red-500',
};
