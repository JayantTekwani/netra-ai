from moviepy import VideoFileClip
clip = VideoFileClip("frontend/public/cctv_delhi_processed.mp4")
clip.write_videofile("frontend/public/cctv_delhi_fixed.mp4", codec="libx264")
