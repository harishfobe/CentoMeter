import React from "react";
import { Camera } from "lucide-react";

export function profileInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function readProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("photo"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("photo"));
      image.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        canvas
          .getContext("2d")
          .drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePhoto({ name, photo, onPhoto }) {
  return (
    <div className="profile-photo">
      <label className="profile-photo-pick">
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          aria-label={photo ? "Change photo" : "Add photo"}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onPhoto(file);
          }}
        />
        <span className="avatar large-avatar">
          {photo ? (
            <img src={photo} alt="Profile photo" />
          ) : (
            profileInitials(name)
          )}
        </span>
        <span className="profile-photo-label">
          <Camera size={16} aria-hidden="true" />
          {photo ? "Change photo" : "Add photo"}
        </span>
      </label>
      {photo ? (
        <button type="button" className="text-button" onClick={() => onPhoto(null)}>
          Remove photo
        </button>
      ) : null}
    </div>
  );
}
