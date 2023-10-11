package utils

import "strings"

// JoinV is a variadic alternative for strings.Join
// it removes empty values in addition
func JoinV(separator string, items ...string) string {
	clean := []string{}
	for _, item := range items {
		if item != "" {
			clean = append(clean, item)
		}
	}
	return strings.Join(clean, separator)
}

func FirstN(str string, n int) string {
	if len(str) < n {
		return str
	}
	if n < 1 {
		return ""
	}
	return str[0:n]
}
