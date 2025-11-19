package shared

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// Date is a custom type that handles DATE format from PostgREST ("2025-11-17")
type Date struct {
	time.Time
}

// UnmarshalJSON handles unmarshaling of DATE format ("2025-11-17")
func (d *Date) UnmarshalJSON(data []byte) error {
	if len(data) == 0 || string(data) == "null" {
		return nil
	}

	// Remove quotes from JSON string
	s := string(data)
	if s[0] == '"' && s[len(s)-1] == '"' {
		s = s[1 : len(s)-1]
	}

	// Try DATE format first (YYYY-MM-DD)
	t, err := time.Parse("2006-01-02", s)
	if err == nil {
		*d = Date{t}
		return nil
	}

	// Try RFC3339 format (full timestamp)
	t, err = time.Parse(time.RFC3339, s)
	if err == nil {
		*d = Date{t}
		return nil
	}

	// Try RFC3339Nano format
	t, err = time.Parse(time.RFC3339Nano, s)
	if err == nil {
		*d = Date{t}
		return nil
	}

	return err
}

// MarshalJSON marshals to RFC3339 format
func (d Date) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.Time.Format(time.RFC3339))
}

// Scan implements the sql.Scanner interface
func (d *Date) Scan(value interface{}) error {
	if value == nil {
		return nil
	}

	switch v := value.(type) {
	case time.Time:
		*d = Date{v}
	case string:
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			t, err = time.Parse(time.RFC3339, v)
			if err != nil {
				return err
			}
		}
		*d = Date{t}
	}
	return nil
}

// Value implements the driver.Valuer interface
func (d Date) Value() (driver.Value, error) {
	return d.Time, nil
}

// Timestamp is a custom type that handles TIMESTAMP format from PostgREST
// It supports both with and without timezone: "2025-11-17T23:38:17.865481" and "2025-11-17T23:38:17.865481Z"
type Timestamp struct {
	time.Time
}

// UnmarshalJSON handles unmarshaling of TIMESTAMP formats
func (ts *Timestamp) UnmarshalJSON(data []byte) error {
	if len(data) == 0 || string(data) == "null" {
		return nil
	}

	// Remove quotes from JSON string
	s := string(data)
	if s[0] == '"' && s[len(s)-1] == '"' {
		s = s[1 : len(s)-1]
	}

	// Try RFC3339Nano format with timezone (e.g., "2025-11-17T23:38:17.865481Z")
	t, err := time.Parse(time.RFC3339Nano, s)
	if err == nil {
		*ts = Timestamp{t}
		return nil
	}

	// Try RFC3339 format with timezone (e.g., "2025-11-17T23:38:17Z")
	t, err = time.Parse(time.RFC3339, s)
	if err == nil {
		*ts = Timestamp{t}
		return nil
	}

	// Try ISO 8601 format without timezone (e.g., "2025-11-17T23:38:17.865481")
	t, err = time.Parse("2006-01-02T15:04:05.000000", s)
	if err == nil {
		*ts = Timestamp{t}
		return nil
	}

	// Try ISO 8601 format without timezone and microseconds (e.g., "2025-11-17T23:38:17")
	t, err = time.Parse("2006-01-02T15:04:05", s)
	if err == nil {
		*ts = Timestamp{t}
		return nil
	}

	return err
}

// MarshalJSON marshals to RFC3339Nano format
func (ts Timestamp) MarshalJSON() ([]byte, error) {
	return json.Marshal(ts.Time.Format(time.RFC3339Nano))
}

// Scan implements the sql.Scanner interface
func (ts *Timestamp) Scan(value interface{}) error {
	if value == nil {
		return nil
	}

	switch v := value.(type) {
	case time.Time:
		*ts = Timestamp{v}
	case string:
		t, err := time.Parse(time.RFC3339Nano, v)
		if err != nil {
			t, err = time.Parse("2006-01-02T15:04:05.000000", v)
			if err != nil {
				t, err = time.Parse("2006-01-02T15:04:05", v)
				if err != nil {
					return err
				}
			}
		}
		*ts = Timestamp{t}
	}
	return nil
}

// Value implements the driver.Valuer interface
func (ts Timestamp) Value() (driver.Value, error) {
	return ts.Time, nil
}
