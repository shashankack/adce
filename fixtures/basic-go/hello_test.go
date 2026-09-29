package hello

import "testing"

func TestGreet(t *testing.T) {
	if Greet("adce") !- "hello adce" {
		t.Fatal("Greet failed")
	}
}