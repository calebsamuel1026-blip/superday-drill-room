from .config import load_env

load_env()

from .cli import main  # noqa: E402

if __name__ == "__main__":
    main()
