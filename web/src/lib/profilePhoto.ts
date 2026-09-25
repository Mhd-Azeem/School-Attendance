export const LEGACY_PROFILE_PHOTO_KEY='school_attendance_profile_photo'
export const profilePhotoKey=(userId:string)=>`school_attendance_profile_photo:${userId}`
export function getProfilePhoto(userId?:string|null){
 if(!userId)return ''
 return localStorage.getItem(profilePhotoKey(userId))||''
}
export function setProfilePhoto(userId:string,value:string){
 localStorage.setItem(profilePhotoKey(userId),value)
}
export function removeProfilePhoto(userId:string){
 localStorage.removeItem(profilePhotoKey(userId))
}
export function clearLegacyProfilePhoto(){
 localStorage.removeItem(LEGACY_PROFILE_PHOTO_KEY)
}
