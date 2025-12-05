// app/index.tsx
import { Redirect, RelativePathString } from 'expo-router';

export default function Index() {
    return <Redirect href={"/(tabs)/home" as RelativePathString}/>;
}
