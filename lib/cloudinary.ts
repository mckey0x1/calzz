export async function uploadToCloudinary(imageUri: string): Promise<string | null> {
  try {
    const cloudName = "depqvqscd";
    const uploadPreset = "calzz_preset";
    
    // Cloudinary endpoint for unauthenticated image uploads
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    
    // If it's a base64 string without data prefix, we must prefix it. 
    // Usually Expo Camera base64 string doesn't have the prefix if we just took 'base64: true'.
    let fileToUpload = imageUri;
    if (imageUri.startsWith('file://')) {
      // It's a local file uri
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: `food_log_${Date.now()}.jpg`,
      } as any);
    } else {
      // Assuming base64 or other string, format if necessary
      fileToUpload = imageUri.startsWith('data:image') ? imageUri : `data:image/jpeg;base64,${imageUri}`;
      formData.append("file", fileToUpload);
    }

    formData.append("upload_preset", uploadPreset);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error("Cloudinary upload failed", data);
      return null;
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
}
