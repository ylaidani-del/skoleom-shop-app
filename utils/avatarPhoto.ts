import * as ImagePicker from 'expo-image-picker';

export interface AvatarPhoto {
  uri: string;
  base64: string;
}

export type AvatarPhotoSource = 'camera' | 'library';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  base64: true,
  quality: 0.6,
  allowsEditing: true,
  aspect: [3, 4],
};

/**
 * Picks the full-body photo the try-on avatar is generated from, either from
 * the camera or the gallery. Returns null when the permission is refused, the
 * user cancels, or the asset came back without base64 data — callers treat all
 * three the same way: keep the photo they already had.
 */
export async function pickAvatarPhoto(source: AvatarPhotoSource): Promise<AvatarPhoto | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled) return null;

  const asset = result.assets[0];
  return asset?.base64 ? { uri: asset.uri, base64: asset.base64 } : null;
}
