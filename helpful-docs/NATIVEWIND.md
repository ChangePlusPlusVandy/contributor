# NativeWind - Tailwind CSS for React Native

**What is NativeWind?** NativeWind allows you to use Tailwind CSS utility classes to style your React Native components. It processes styles at build time for optimal performance and provides a consistent styling experience across web and native platforms.

---

## Setup Complete

NativeWind has been configured in your Expo project with the following files:

- `tailwind.config.js` - Tailwind configuration
- `global.css` - Tailwind directives
- `babel.config.js` - Babel preset for NativeWind
- `metro.config.js` - Metro bundler configuration
- `nativewind-env.d.ts` - TypeScript type definitions

---

## Basic Usage

Use the `className` prop instead of `style` on React Native components:

```tsx
import { View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-blue-500 text-xl font-bold">
        Hello NativeWind!
      </Text>
    </View>
  );
}
```

---

## Common Utility Classes

### Layout

```tsx
// Flexbox
<View className="flex-1" />
<View className="flex-row" />
<View className="flex-col" />
<View className="items-center" />
<View className="justify-center" />
<View className="justify-between" />

// Padding & Margin
<View className="p-4" />        // padding: 16px
<View className="px-4" />       // horizontal padding
<View className="py-2" />       // vertical padding
<View className="m-4" />        // margin: 16px
<View className="mt-2" />       // margin-top: 8px
```

### Sizing

```tsx
<View className="w-full" />     // width: 100%
<View className="h-20" />       // height: 80px
<View className="w-64" />       // width: 256px
<View className="h-screen" />   // height: 100vh
```

### Colors

```tsx
// Background
<View className="bg-blue-500" />
<View className="bg-gray-100" />
<View className="bg-red-600" />

// Text
<Text className="text-white" />
<Text className="text-gray-900" />
<Text className="text-blue-500" />

// Border
<View className="border-gray-300" />
```

### Typography

```tsx
<Text className="text-sm" />       // 14px
<Text className="text-base" />     // 16px
<Text className="text-lg" />       // 18px
<Text className="text-xl" />       // 20px
<Text className="text-2xl" />      // 24px

<Text className="font-bold" />
<Text className="font-semibold" />
<Text className="font-normal" />

<Text className="text-center" />
<Text className="text-left" />
<Text className="text-right" />
```

### Borders & Radius

```tsx
<View className="border" />         // border: 1px
<View className="border-2" />       // border: 2px
<View className="rounded" />        // border-radius: 4px
<View className="rounded-lg" />     // border-radius: 8px
<View className="rounded-full" />   // fully rounded
```

### Shadows (iOS/Android)

```tsx
<View className="shadow-sm" />
<View className="shadow" />
<View className="shadow-lg" />
```

---

## Dark Mode

NativeWind automatically supports dark mode with the `dark:` prefix:

```tsx
<View className="bg-white dark:bg-gray-900">
  <Text className="text-black dark:text-white">
    This adapts to dark mode!
  </Text>
</View>
```

---

## Responsive Design

Use breakpoint prefixes for responsive layouts:

```tsx
<View className="w-full md:w-1/2 lg:w-1/3">
  <Text className="text-base md:text-lg lg:text-xl">
    Responsive text
  </Text>
</View>
```

---

## Custom Colors

Add custom colors in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

Use them:

```tsx
<View className="bg-primary" />
<Text className="text-brand-500" />
```

---

## Combining with StyleSheet

You can mix NativeWind with traditional styles:

```tsx
import { StyleSheet } from 'react-native';

<View className="p-4" style={styles.customStyle}>
  <Text className="text-lg font-bold">Mixed styles</Text>
</View>

const styles = StyleSheet.create({
  customStyle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  }
});
```

---

## Important Notes

### React Native Differences

React Native has different defaults than web:
- Default flex direction is `column` (not `row`)
- No `div` or `span` - use `View` and `Text`
- Colors must be applied to `Text`, not `View`

```tsx
// ❌ Wrong
<View className="text-red-500">
  <Text>Hello</Text>
</View>

// ✅ Correct
<View>
  <Text className="text-red-500">Hello</Text>
</View>
```

### Platform-Specific Styles

Some classes only work on specific platforms:
- Most layout/flexbox: All platforms ✅
- Box shadows: Web only 🌐
- Text shadows: Native only 📱
- Some transitions: Web only 🌐

---

## Troubleshooting

**Styles not applying:**
```bash
# Clear cache and restart
cd frontend
npx expo start --clear
```

**TypeScript errors:**
- Make sure `nativewind-env.d.ts` exists
- Restart TypeScript server in VSCode

**Classes not working:**
- Check that paths in `tailwind.config.js` include your files
- Verify `global.css` is imported in `app/_layout.tsx`

---

## Quick Reference

| Task | Class |
|------|-------|
| Center content | `flex-1 items-center justify-center` |
| Full width | `w-full` |
| Padding | `p-4` (16px), `p-8` (32px) |
| Margin top | `mt-2` (8px), `mt-4` (16px) |
| Text color | `text-blue-500` |
| Background | `bg-white` |
| Rounded corners | `rounded-lg` |
| Bold text | `font-bold` |
| Large text | `text-xl` |
| Flexbox row | `flex-row` |
| Space between | `justify-between` |
| Dark mode | `dark:bg-gray-900` |

---

## Resources

- [NativeWind Documentation](https://www.nativewind.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

---

## Example Component

```tsx
import { View, Text, TouchableOpacity } from 'react-native';

export default function Card() {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg m-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Card Title
      </Text>
      <Text className="text-gray-600 dark:text-gray-300 mb-4">
        This is a card component styled with NativeWind
      </Text>
      <TouchableOpacity className="bg-blue-500 py-3 px-6 rounded-lg">
        <Text className="text-white text-center font-semibold">
          Click Me
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

