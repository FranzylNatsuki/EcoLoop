import os
import re

MODALS_DIR = "ecoloop-web/src/components/Modals"

IMPORT_STMT = "\nimport imageCompression from 'browser-image-compression'\n"

# Pattern for single file upload (e.g. CreateEventModal, EditEventModal)
SINGLE_FILE_PATTERN = re.compile(r"function handleFileUpload\(event: Event\) \{(.*?)\}", re.DOTALL)

SINGLE_FILE_REPLACEMENT = r"""async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    try {
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' }
      const compressed = await imageCompression(file, options)
      const newFile = new File([compressed], file.name.replace(/\.[^/.]+$/, ".webp"), { type: 'image/webp' })
      selectedFile.value = newFile
      formData.value.bannerImage = URL.createObjectURL(newFile)
    } catch (e) { console.error('Compression error:', e) }
  }
}"""

# EditProfileModal has avatarFile and avatarPreview
PROFILE_REPLACEMENT = r"""async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  try {
    const options = { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true, fileType: 'image/webp' }
    const compressed = await imageCompression(file, options)
    const newFile = new File([compressed], file.name.replace(/\.[^/.]+$/, ".webp"), { type: 'image/webp' })
    avatarFile.value = newFile

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        avatarPreview.value = e.target.result as string
      }
    }
    reader.readAsDataURL(newFile)
  } catch(e) { console.error('Compression error', e) }
}"""

# For multi-file uploads (DonateMaterialsModal, DonateEventMaterialsModal, CreateMarketplaceModal)
MULTI_FILE_REPLACEMENT = r"""async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const files = Array.from(target.files)
  const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' }

  for (const file of files) {
    try {
      const compressed = await imageCompression(file, options)
      const newFile = new File([compressed], file.name.replace(/\.[^/.]+$/, ".webp"), { type: 'image/webp' })
      imageFiles.value.push(newFile)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          imagePreviews.value.push(e.target.result as string)
        }
      }
      reader.readAsDataURL(newFile)
    } catch (error) {
      console.error('Compression error:', error)
    }
  }
}"""

# EditPostModal uses newImageFiles and newImagePreviews
MULTI_FILE_REPLACEMENT_EDITPOST = r"""async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const files = Array.from(target.files)
  const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' }

  for (const file of files) {
    try {
      const compressed = await imageCompression(file, options)
      const newFile = new File([compressed], file.name.replace(/\.[^/.]+$/, ".webp"), { type: 'image/webp' })
      newImageFiles.value.push(newFile)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          newImagePreviews.value.push(e.target.result as string)
        }
      }
      reader.readAsDataURL(newFile)
    } catch (error) {
      console.error('Compression error:', error)
    }
  }
}"""


for filename in os.listdir(MODALS_DIR):
    if not filename.endswith(".vue"): continue
    
    filepath = os.path.join(MODALS_DIR, filename)
    with open(filepath, "r") as f:
        content = f.read()
    
    if "function handleFileUpload" not in content:
        continue
        
    print(f"Patching {filename}")
    
    # Add import
    if "import imageCompression" not in content:
        content = content.replace("function handleFileUpload", IMPORT_STMT + "function handleFileUpload")
    
    # Replace handleFileUpload body
    if filename in ["CreateEventModal.vue", "EditEventModal.vue"]:
        content = SINGLE_FILE_PATTERN.sub(SINGLE_FILE_REPLACEMENT, content)
    elif filename == "EditProfileModal.vue":
        content = SINGLE_FILE_PATTERN.sub(PROFILE_REPLACEMENT, content)
    elif filename == "EditPostModal.vue":
        content = SINGLE_FILE_PATTERN.sub(MULTI_FILE_REPLACEMENT_EDITPOST, content)
    elif filename in ["DonateMaterialsModal.vue", "DonateEventMaterialsModal.vue", "CreateMarketplaceModal.vue"]:
        content = SINGLE_FILE_PATTERN.sub(MULTI_FILE_REPLACEMENT, content)
    
    with open(filepath, "w") as f:
        f.write(content)

