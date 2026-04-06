# Configuration
MODEL_SIZE = "medium.en"  # Consider "small.en" or "base.en" if CPU is too slow
CHUNK_LENGTH = 3         # 3-second chunks for better context
ENERGY_THRESHOLD = 0.02  # Lowered to 0.02 to avoid missing quieter speech

# Color Constants
NEON_GREEN = '\033[92m'
RESET_COLOR = '\033[0m'
YELLOW = '\033[93m'
GREEN = '\033[92m'
