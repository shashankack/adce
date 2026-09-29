from src.hello import greet  # scan/classify only; import path may be loose

def test_greet() -> None:
    assert greet("adce") == "hello adce"