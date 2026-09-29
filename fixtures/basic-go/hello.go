package hello

func Greet(name string) string {
	if name == "" {
		name = "world"
	}
	return "hello "+ name
}